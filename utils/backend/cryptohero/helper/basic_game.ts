import { getCryptoHeroDb, isLockTaken, logCryptoHeroErrorDb } from "../../common/mongo-helper";
import { APP_CONTRACT, viewFunction } from "../../common/blockchain";
import { ClassType, DifficultyType, ItemData, MonsterData, RarityType } from "../dungeon/types";
import { get_characters_by_ids, get_items_by_ids } from "./data_loader";
import { CharacterData, DungeonRequest, ItemToken, LockType, PlayerData, PlayerInventoryData } from "./types";
import { GenerateRandomItem } from "../dungeon/utils";
import { clamp, getCurrentWeekCode, is_testnet_env } from "../../common/utils";
import { RoomData } from "../raid/types";
import { RaidPlayersCount } from "../raid/utils";
import { MaxItems } from "./utils";

export let CACHED_ITEMBASE_DATA: ItemData[] = [];
export let CACHED_MONSTERBASE_DATA: MonsterData[] = [];

let CACHED_ACCOUNT_BANS: string[] = [];
let CACHED_ACCOUNT_BANS_TIMESTAMP: number = 0;

export async function getDbBannedAccounts(): Promise<any[]> {
    const db = await getCryptoHeroDb();
    const accounts = await db.collection<any>("account_ban").find({}, { projection: { _id: 0 } }).toArray();
    return accounts;
}

export async function getCachedBannedAccounts(): Promise<string[]> {
    const elapsedTimeSinceLastCache = clamp(Math.round((Date.now() - CACHED_ACCOUNT_BANS_TIMESTAMP) / 1000), 0, Infinity);
    if (CACHED_ACCOUNT_BANS_TIMESTAMP != 0 &&
        elapsedTimeSinceLastCache < 30) {// original idea was something like 5 minutes but the cache won't last such time
        return CACHED_ACCOUNT_BANS;
    }
    const accounts = await getDbBannedAccounts();
    CACHED_ACCOUNT_BANS = accounts.map(x => x.account_id);
    CACHED_ACCOUNT_BANS_TIMESTAMP = Date.now();
    return CACHED_ACCOUNT_BANS;
}

export async function getItemBaseData(): Promise<ItemData[]> {
    if (CACHED_ITEMBASE_DATA.length != 0) {
        return CACHED_ITEMBASE_DATA;
    }
    const db = await getCryptoHeroDb();
    const items = await db.collection<ItemData>("items").find({}, { projection: { _id: 0 } }).toArray();
    CACHED_ITEMBASE_DATA = items;
    return items;
}

export async function getMonsterBaseData(): Promise<MonsterData[]> {
    if (CACHED_MONSTERBASE_DATA.length != 0) {
       return CACHED_MONSTERBASE_DATA;
    }
    const db = await getCryptoHeroDb();
    const monsters = await db.collection<MonsterData>("monsters").find({}, { projection: { _id: 0 } }).toArray();
    CACHED_MONSTERBASE_DATA = monsters;
    return monsters;
}

export async function getAccountData(account_id: string) {
    const accountdata = await viewFunction(
        APP_CONTRACT,
        "ch_get_player_data",
        { account_id }
    );
    return accountdata;
}

export async function checkFightBalance(account_id: string): Promise<any> {
    const accountdata = await getAccountData(account_id);
    const playerdata = accountdata.playerdata;

    if (playerdata["fight_balance"] == 0) {
        throw "your fight balance is too low";
    }

    return playerdata;
}

export async function checkCharacterInjured(character_id: string): Promise<CharacterData> {
    const characterdata = (await get_characters_by_ids([character_id]))[0] as CharacterData;

    if (characterdata.injured_timer > Date.now().toString()) {
        throw "your character is not ready";
    }

    return characterdata;
}

export function getCharacterId(account_id: string, class_type: ClassType): string {
    if (is_testnet_env()) {// keep testnet working pls
        return `f:${class_type}:${account_id}`;
    }
    return `${account_id}:${class_type}`;
}

export async function getPlayerData(rq: DungeonRequest, ignore_maxitems: boolean = false): Promise<PlayerData> {
    const playerdata = await checkFightBalance(rq.account_id);
    const character_ids = playerdata.character_ids as string[];
    const character_id = getCharacterId(rq.account_id, rq.playerdata.class_type);

    // check if player does have character unlocked
    if (!character_ids.includes(character_id)) {
        throw "you did not unlocked this character";
    }

    const item_ids = playerdata.item_ids as string[];
    const itemBaseData = await getItemBaseData();
    let itemsdata: ItemToken[] = [];

    if (!ignore_maxitems && item_ids.length >= MaxItems) {
        throw `more than ${MaxItems} items not supported`;
    }

    if (rq.playerdata.inventory.length != 0) {
        // check item count, inventory is up to 6 items
        if (rq.playerdata.inventory.length > 6) {
            await logCryptoHeroErrorDb(rq.playerdata.inventory, rq.account_id, "too many items");
            throw "you can't equip more than 6 items";
        }

        // check for duplicated item token ids
        const duplicate_item_ids = rq.playerdata.inventory.filter((item, index) => rq.playerdata.inventory.indexOf(item) != index);
        if (duplicate_item_ids.length != 0) {
            throw "duplicated items not allowed";
        }

        // check items ownership
        rq.playerdata.inventory.forEach(item_id => {
            if (!item_ids.includes(item_id)) {
                throw "you don't own this item";
            }
        });

        // fetch all inventory ItemTokens from blockchain
        itemsdata = await get_items_by_ids(rq.playerdata.inventory);

        // check for items being sold
        itemsdata.forEach(item_token => {
            if (item_token.price != "0") {
                throw "you can't equip items on sale";
            }
        });

        // check if all items can be equipped by player's character
        itemsdata.forEach(item_token => {
            const x = itemBaseData.find(x => x.item_type == item_token.item_type);
            if (x.class_type != rq.playerdata.class_type) {
                throw "you can't equip some of your items";
            }
        });

        // check for duplicate items on same slot
        const duplicate_item_equip = itemsdata
            .map(x => itemBaseData.find(y => x.item_type == y.item_type).equip_type)
            .filter((item, index, arr) => arr.indexOf(item) != index);

        if (duplicate_item_equip.length != 0) {
            throw "you can't equip multiple items of same slot";
        }
    }

    const characterdata = await checkCharacterInjured(character_id);

    const pdata: PlayerData = {
        account_id: rq.account_id,
        player_character: characterdata,
        player_inventory: rq.playerdata.inventory.map<PlayerInventoryData>(id => {
            const x = itemsdata.find(x => x.token_id == id);
            return {
                token_id: x.token_id,
                item_type: x.item_type,
                rarity_type: x.rarity_type,
                strength: x.strength,
                dexterity: x.dexterity,
                endurance: x.endurance,
                intelligence: x.intelligence,
                luck: x.luck,
            }
        }),
        last_fight: Date.now(),
    };

    return pdata;
}

export async function updateLeaderboard(char_rank: number, player_data: PlayerData) {
    const options = { upsert: true };
    const db = await getCryptoHeroDb();
    const filter = {
        account_id: player_data.account_id,
        class_type: player_data.player_character.class_type
    };
    const update = {
        $set: {
            class_type: player_data.player_character.class_type,
            char_level: player_data.player_character.level,
            inventory: player_data.player_inventory,
            last_fight: player_data.last_fight,
            char_rank: char_rank,
        }
    };
    await db.collection("leaderboard").updateOne(filter, update, options);
}

export async function getLeaderboard(class_type: ClassType, results: number = 100): Promise<any[]> {
    const db = await getCryptoHeroDb();
    const entries = await db.collection("leaderboard").find({
        class_type: class_type
    })
    .sort({
        char_rank: -1,
    })
    .project({
        _id: 0,
        last_fight: 0,
        char_rank: 0,
    })
    .limit(results)
    .toArray();
    return entries;
}

export async function getCharacterWithPosition(account_id: string, class_type: number): Promise<any> {
    const db = await getCryptoHeroDb();
    const playerData = await db.collection("leaderboard").findOne(
        { account_id: account_id, class_type: class_type },
        {
            projection: {
                _id: 0,
                last_fight: 0,
                char_rank: 0,
            }
        });

    if (playerData) {
        const index = await db.collection("leaderboard")
        .find({ class_type: class_type })
        .sort({
            char_rank: -1,
        })
        .toArray()
        .then(x => x.findIndex(y => y.account_id == playerData.account_id));
        playerData["position"] = index + 1;
        return playerData;
    }

    return null;
}

export async function getRaidscores(difficulty: DifficultyType, results: number = 100, w_code = getCurrentWeekCode()): Promise<any[]> {
    const db = await getCryptoHeroDb();
    const entries = await db.collection("rooms").aggregate([
        {
            $project: {
                _id: 0,
                account_id: 1,
                difficulty: 1,
                week_code: 1,
                playerNames: 1,
                playerClasses: 1,
                playerRanks: 1,
                boss_kills: 1,
                playerBossKills: 1,
                playersCount: { $size: "$playerNames" }
            }
        },
        {
            $match: {
                difficulty: difficulty,
                week_code: w_code,
                playersCount: !is_testnet_env() ? {
                    $eq: RaidPlayersCount
                } : {
                    $gte: 1
                }
            }
        },
        {
            $sort: {
                boss_kills: -1
            }
        },
        {
            $limit: results
        }
    ])
    .toArray();
    return entries;
}

export async function getRoomWithPosition(roomData: RoomData): Promise<RoomData | null> {
    if (roomData) {
        const db = await getCryptoHeroDb();
        const index = await db.collection("rooms")
        .find({
            difficulty: roomData.difficulty,
            week_code: roomData.week_code
        })
        .sort({
            boss_kills: -1,
        })
        .project({
            _id: 0,
            account_id: 1,
        })
        .toArray()
        .then(x => x.findIndex(y => y.account_id == roomData.account_id));
        roomData["position"] = index + 1;
        return roomData;
    }
    return null;
}

export async function getInventoryData(account_id: string, class_type: ClassType): Promise<PlayerInventoryData[]> {
    const db = await getCryptoHeroDb();
    const playerData = await db.collection("leaderboard").findOne(
        { account_id: account_id, class_type: class_type },
        { projection: { _id: 0, inventory: 1 } }
    );
    if (playerData) {
        return playerData.inventory;
    }
    return [];
}

export function checkLootboxBalance(balance: any, rarity_type: RarityType): boolean {
    switch (rarity_type) {
        case RarityType.Common:
            return balance.common > 0;
        case RarityType.Rare:
            return balance.rare > 0;
        case RarityType.Epic:
            return balance.epic > 0;
        case RarityType.Legendary:
            return balance.legendary > 0;
    }
    return false;
}

export async function getLootbox(account_id: string, rarity_type: RarityType): Promise<ItemData[] | null> {
    const db = await getCryptoHeroDb();
    const lootBox = await db.collection("lootboxes").findOne(
        { account_id: account_id, rarity_type: rarity_type },
        { projection: { _id: 0, items: 1 } }
    );

    if (lootBox) {
        return lootBox.items;
    }

    return null;
}

export async function createLootbox(account_id: string, rarity_type: RarityType): Promise<ItemData[]> {
    await getItemBaseData();
    const itemsData: ItemData[] = [];

    for (let i = 0; i < 10; i++) {
        itemsData[i] = GenerateRandomItem(rarity_type);
    }

    const db = await getCryptoHeroDb();
    const filter = {
        account_id: account_id,
        rarity_type: rarity_type
    };
    const update = {
        $set: {
            items: itemsData
        }
    };
    const options = { upsert: true };

    await db.collection("lootboxes").updateOne(filter, update, options);
    return itemsData;
}

export async function deleteLootbox(account_id: string, rarity_type: RarityType): Promise<void> {
    const db = await getCryptoHeroDb();
    await db.collection("lootboxes").deleteOne({ account_id: account_id, rarity_type: rarity_type });
}

// account locking

export async function lockAccount(account_id: string, lock_type: LockType): Promise<boolean> {
    const db = await getCryptoHeroDb();
    const filter = {
        account_id: account_id,
        lock_type: lock_type,
    };
    const update = {
        $set: {
            timestamp: new Date(),
        },
        $inc: {
            attempts: 1,
        }
    };
    const options = { upsert: true };
    const result = await db.collection("account_lock").updateOne(filter, update, options);
    const lockTaken = isLockTaken(result);

    if (!lockTaken) {
        const retry = await db.collection("account_lock").findOne(filter);
        if (retry.attempts >= 5) {
            await banAccount(account_id);
        }
    }

    return lockTaken;
}

export async function unlockAccount(account_id: string, lock_type: LockType): Promise<void> {
    const db = await getCryptoHeroDb();
    const filter = {
        account_id: account_id,
        lock_type: lock_type,
    };
    await db.collection("account_lock").deleteOne(filter);
}

export async function banAccount(account_id: string, is_temporary: boolean = true, reason: string | null = null): Promise<void> {
    const db = await getCryptoHeroDb();
    const update = {};
    if (is_temporary) {
        update["$set"] = {
            timestamp: new Date(),
            reason: reason ? reason : undefined,
        };
    }
    else {
        update["$set"] = {
            reason: reason ? reason : undefined,
        };
    }
    const options = { upsert: true };
    await db.collection("account_ban").updateOne(
        { account_id: account_id },
        update, options);
}

export async function unbanAccount(account_id: string): Promise<void> {
    const db = await getCryptoHeroDb();
    await db.collection("account_ban").deleteMany({ account_id: account_id });
}

// ---

export const TESTDEV_ACCOUNT = process.env.TESTDEV_ACCOUNT;
export const TESTDEV_KEY = process.env.TESTDEV_KEY;