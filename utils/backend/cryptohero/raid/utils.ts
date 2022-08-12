import { getCryptoHeroDb } from "../../common/mongo-helper";
import { clamp, getCurrentWeekCode, getRandomFloat, getRandomVector2 } from "../../common/utils";
import { DifficultyType, MonsterType, StatStruct } from "../dungeon/types";
import { GenerateMonsterStatStruct, getMonsterByType } from "../helper/utils";
import { RoomData } from "./types";

export const RaidPlayersCount: number = 8;

export function GenerateBossStats(difficulty: DifficultyType, charStructs: StatStruct[], boss_kills: number, monsterType: MonsterType): StatStruct {
    const monsterData = getMonsterByType(monsterType);
    const playersCount = charStructs.length;
    let statSum: number = 0;

    for (let i: number = 0; i < playersCount; i++) {
        const charStruct = charStructs[i];
        statSum +=
            Math.round(charStruct.critChance * 100) +
            Math.round(charStruct.lifeSteal * 100) +
            Math.round(charStruct.dodge * 100) +
            Math.round(charStruct.defense * 100) +
            charStruct.damage + charStruct.maxHealth / 2;
    }

    statSum /= playersCount;

    const multiplier = getRandomFloat(.01, .02) / (1 + statSum * .001);
    const statAdd = Math.round(clamp(statSum - 250, 1, Infinity) * multiplier);

    //ank boss scaling
    const statMultiplier = 1 + (statSum / 6 * multiplier) + (difficulty * .1) + (boss_kills * .022);

    const dexterity = Math.round((getRandomVector2(monsterData.dex_range) + statAdd) * statMultiplier);
    const strength = Math.round((getRandomVector2(monsterData.str_range) + statAdd) * statMultiplier);
    const intelligence = Math.round((getRandomVector2(monsterData.int_range) + statAdd) * statMultiplier);
    const endurance = Math.round((getRandomVector2(monsterData.end_range) + statAdd) * statMultiplier);
    const luck = Math.round((getRandomVector2(monsterData.lck_range) + statAdd) * statMultiplier);

    const bossStatStruct = GenerateMonsterStatStruct(monsterData.class_type, dexterity, strength, intelligence, endurance, luck);
    const bossStruct = new StatStruct(
        bossStatStruct.maxHealth,
        bossStatStruct.damage,
        10,
        0,
        bossStatStruct.lifeSteal,
        bossStatStruct.critChance
    );

    return bossStruct;
}

export function HasPlayerAlive(charHPs: number[]): boolean {
    const playersCount = charHPs.length;
    for (let i: number = 0; i < playersCount; i++) {
        if (charHPs[i] > 0) {
            return true;
        }
    }
    return false;
}

/*
 * raid rooms code
 */

export async function createOrUpdateRoom(roomData: RoomData): Promise<void> {
    const db = await getCryptoHeroDb();
    await db.collection("rooms").updateOne(
        { account_id: roomData.account_id, week_code: roomData.week_code },
        { $set: roomData },
        { upsert: true });
}

export async function checkInsertUsedItems(account_id: string, items: string[], week_code: string): Promise<string | null> {
    const db = await getCryptoHeroDb();
    const doc = await db.collection("used_items").findOne({
        token_id: {
            $in: items
        },
        account_id: {
            $ne: account_id
        },
        week_code: week_code
    });

    if (doc) {
        return `${doc.account_id}#${doc.token_id}`;
    }

    const db_items = [];
    const createdAt = new Date();

    items.forEach(item => {
        db_items.push({
            token_id: item,
            account_id: account_id,
            week_code: week_code,
            created_at: createdAt
        });
    });

    await db.collection("used_items").insertMany(db_items);
    return null;
}



export async function getRoom(account_id: string, w_code: string | null = null): Promise<RoomData | null> {
    const db = await getCryptoHeroDb();
    if (!w_code) {
        w_code = getCurrentWeekCode();
    }
    const roomData = await db.collection("rooms").findOne<RoomData>(
        { week_code: w_code, playerNames: account_id },
        { projection: { _id: 0 } }
    );
    return roomData || null;
}

export async function getRoomByLeader(account_id: string, w_code: string | null = null): Promise<RoomData | null> {
    const db = await getCryptoHeroDb();
    if (!w_code) {
        w_code = getCurrentWeekCode();
    }
    const roomData = await db.collection("rooms").findOne<RoomData>(
        { account_id: account_id, week_code: w_code },
        { projection: { _id: 0 } }
    );
    return roomData || null;
}

/*
 * begin raid blockchain replacement data
 */

/*function ch_get_raid_prefix(account_id: string, week_code: string): string {
    return `r:${week_code}:${account_id}`;
}

async function getRaidGroup(account_id: string, week_code: string): Promise<ChRaidData | null> {
    const db = await getCryptoHeroDb();
    const raid_id = ch_get_raid_prefix(account_id, week_code);
    const raid_data = await db.collection("raid_groups").findOne<ChRaidData>(
        { raid_id: raid_id },
        { projection: { _id: 0 } }
    );
    return raid_data || null;
}

export async function createRaidGroup(account_id: string, week_code: string, difficulty: number): Promise<void> {
    const db = await getCryptoHeroDb();
    const raid_id = ch_get_raid_prefix(account_id, week_code);
    const ch_raid_data = {
        raid_id: raid_id,
        difficulty: difficulty,
        account_ids: [],
        boss_kills: 0,
    } as ChRaidData;

    const raid_data = await getRaidGroup(account_id, week_code);
    if (raid_data) {
        throw "Raid already exists";
    }

    await db.collection("raid_groups").updateOne(
        { raid_id: raid_id },
        { $set: ch_raid_data },
        { upsert: true });

    await joinRaidGroup(account_id, account_id, week_code);
}

export async function joinRaidGroup(account_id: string, leader_id: string, week_code: string): Promise<void> {
    const db = await getCryptoHeroDb();
    const raid_id = ch_get_raid_prefix(leader_id, week_code);
    const raid_data = await getRaidGroup(leader_id, week_code);

    if (!raid_data) {
        throw "Raid does not exists";
    }

    if (raid_data.account_ids.includes(account_id)) {
        throw "Player already in room";
    }

    if (raid_data.account_ids.length >= CH_RAID_PLAYERS_COUNT) {
        throw "Raid is full";
    }

    raid_data.account_ids.push(account_id);

    await db.collection("raid_groups").updateOne(
        { raid_id: raid_id },
        { $set: raid_data },
        { upsert: true });
}

export async function saveRaidResults(raidInfo: ChRaidInfo): Promise<void> {
    const db = await getCryptoHeroDb();
    const raid_id = ch_get_raid_prefix(raidInfo.leader_id, raidInfo.week_code);
    const raid_data = await getRaidGroup(raidInfo.leader_id, raidInfo.week_code);

    if (!raid_data) {
        throw "Raid does not exists";
    }

    if (!is_testnet_env()) {
        if (raid_data.account_ids.length < CH_RAID_PLAYERS_COUNT) {
            throw "Raid is not full";
        }
    }

    if (!raid_data.account_ids.includes(raidInfo.account_id)) {
        throw "Player not found";
    }

    if (raidInfo.victory) {
        raid_data.boss_kills++;

        await db.collection("raid_groups").updateOne(
            { raid_id: raid_id },
            { $set: raid_data },
            { upsert: true });
    }
}*/

/*
 * end raid blockchain replacement data
 */