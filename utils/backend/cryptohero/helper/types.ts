import { FunctionRequest } from "../../common/types";
import { DifficultyType, PotionType, RarityType } from "../dungeon/types";

export type PlayerData = {
    account_id: string,
    player_character: CharacterData,
    player_inventory: PlayerInventoryData[],
    last_fight: number,
}

export class PlayerInventoryData {
    public token_id: string;
    public item_type: number;
    public rarity_type: number;
    public strength: number;
    public dexterity: number;
    public endurance: number;
    public intelligence: number;
    public luck: number;
}

export class CharacterData {
    public class_type: number;
    public experience: number;
    public level: number;
    public injured_timer: string;
    public potions: PotionData[];
}

export class PotionData {
    constructor(
        public potion_type: PotionType,
        public amount: number = 0,
        public strength: number = 0,
    ) { }
}

export class ItemToken {
    public token_id: string;
    public item_type: number;
    public rarity_type: number;
    public strength: number;
    public dexterity: number;
    public endurance: number;
    public intelligence: number;
    public luck: number;
    public owner: string;
    public price: string;
}

/*
 * begin raid blockchain replacement data
 */

// export const CH_RAID_PLAYERS_COUNT: number = 8;

// the results class that we normaly send to the contract
export class ChRaidInfo {
    public account_id: string;
    public character_results: {
        class_type: number,
        exp_gain: number,
        level_up: boolean,
    };
    public difficulty: number;
    public victory: boolean;
    public leader_id: string;
    public week_code: string;
}

/*// the actual raid data stored in the chain
export class ChRaidData {
    public raid_id: string;
    public account_ids: string[];
    public difficulty: number;
    public boss_kills: number;
}*/

/*
 * end raid blockchain replacement data
 */

export type EditItemRequest = FunctionRequest & {
    password: string,
    itemdata: {
        item_name: string,
        item_type: number,
        equip_type: number,
        class_type: number,
        rarity_type: number,
    }
}

export type EditMonsterRequest = FunctionRequest & {
    password: string,
    monsterdata: {
        monster_name: string,
        monster_type: number,
        class_type: number,
        str_range: number[],
        dex_range: number[],
        end_range: number[],
        int_range: number[],
        lck_range: number[],
    }
}

export type DungeonRequest = FunctionRequest & {
    playerdata: {
        difficulty: DifficultyType,
        class_type: number,
        inventory: string[],
    }
}

export type OfferItemRequest = FunctionRequest & {
    itemdata: {
        token_id: string,
        price: string,
    }
}

export type CancelOfferItemRequest = FunctionRequest & {
    itemdata: {
        token_id: string,
    }
}

export type BuyItemRequest = FunctionRequest & {
    itemdata: {
        token_id: string,
    }
}

export type AdvancedSearchRequest = FunctionRequest & {
    itemdata: {
        class_type: number,
        equip_type: number,
        rarity_type: number,
        minStat: number,
    }
}

export type CreateRoomRequest = DungeonRequest;

export type StartRoomRequest = DungeonRequest;

export type JoinRoomRequest = DungeonRequest & {
    roomdata: {
        leader_id: string,
    }
}

export type KickPlayerRequest = FunctionRequest & {
    playerdata: {
        account_id: string,
    },
    publickey: string
}

export type RaidScoresRequest = FunctionRequest & {
    raiddata: {
        difficulty: DifficultyType,
    }
}

export type RequestLootboxRequest = FunctionRequest & {
    rarity_type: RarityType,
}

export type OpenLootboxRequest = FunctionRequest & {
    rarity_type: RarityType,
    item1_index: number,
    item2_index: number,
}

// --

export enum LockType {
    Dungeon = 0,
    Raid = 1,
}