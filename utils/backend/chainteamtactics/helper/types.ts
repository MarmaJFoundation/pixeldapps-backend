import { FunctionRequest } from "../../common/types";
import { Vector2 } from "../../common/utils";
import { FightStruct, MapData, UnitData } from "../battle/types";

export type PlayerData = {
    account_id: string,
    matches_won: number,
    matches_lost: number,
    rating: number,
    player_loadout: PlayerLoadoutData[],
}

export class PlayerLoadoutData {
    public token_id: string;
    public unit_type: number;
    public health: number;
    public damage: number;
    public speed: number;
    public position: Vector2;
}

export class UnitToken {
    public token_id: string;
    public unit_type: number;
    public health_mod: number;
    public damage_mod: number;
    public speed_mod: number;
    public owner: string;
    public price: string;
}

export class UnitScaledToken {
    public token_id: string;
    public unit_type: number;
    public health: number;
    public damage: number;
    public speed: number;
    public power: number;
    public owner: string;
    public price: string;
}

export class RoomData {
    constructor(
        public account_id: string,
        public mapIndex: number,
        public betType: RoomBetTierTypes,
        public playerNames: string[] = [],
        public playerRanks: number[] = [],
        public playerRoundWins: number[] = [],
        public playerFightWins: number[] = [],// only stores the room creator won/lost counts
        public playerLoadouts: PlayerLoadoutData[][] = [],
        public last_activity: number = 0,
        // internal usage only
        public prev_round_winner: string = "",// who win previous round
        public prev_round_loser: string = "",// who lose previous round
        public prev_round_id: string = "",// who played previous round
        public notify_id: string = "",// who will be notified about last fight
        public round_nr: number = 0,// which player loadout will be shown at get-room-info
    ) { }
}

export enum RoomBetTierTypes {
    Tier1 = 0,// 5 PXT
    Tier2 = 1,// 50 PXT
    Tier3 = 3,// 500 PXT
}

export enum RoomNotificationType {
    PendingCreate = 0,
    PendingJoin = 1,
    RoundFinish = 2,
    FightFinish = 3,
    ClosedRoom = 4,
}

export class RoomNotificationData {
    public notify_type: RoomNotificationType;
    public room_id: string;
    public map_index: number;// PendingCreate/PendingJoin
    public betType: RoomBetTierTypes;
    public loadout: PlayerLoadoutData[];// PendingJoin
    public target_ids: string[] = [];// player who'll be notified about
    public winner_id: string;// player who won previous round
    public round_id: string;// player who played previous round
    public fightStruct: FightStruct;// entire replay of the previous round
    public hasFightStruct: boolean;// just a flag to tell client when replay is included
    public rounds: number;
}

export type EditUnitRequest = FunctionRequest & {
    password: string,
    unitdata: UnitData & {
        unit_name: string,
    }
}

export type EditMapRequest = FunctionRequest & {
    password: string,
    mapdata: MapData & {
        map_name: string,
    }
}

export type OfferUnitRequest = FunctionRequest & {
    unitdata: {
        token_id: string,
        price: string,
    }
}

export type CancelOfferUnitRequest = FunctionRequest & {
    unitdata: {
        token_id: string,
    }
}

export type BuyUnitRequest = FunctionRequest & {
    unitdata: {
        token_id: string,
    }
}

export type AdvancedSearchRequest = FunctionRequest & {
    unitdata: {
        unit_type: number,
        minStat: number,
    }
}

export type BeginCreateRoomRequest = FunctionRequest & {
    publickey: string,
    bet_type: number,
}

export type EndCreateRoomRequest = FunctionRequest & {
    publickey: string,
    player_loadout: {
        token_id: string,
        position: Vector2,
    }[]
}

export type JoinRoomRequest = FunctionRequest & {
    publickey: string,
    leader_id: string,
}

export type GetAllRoomsRequest = FunctionRequest & {
    publickey: string,
}

export type ChallengeRequest = FunctionRequest & {
    publickey: string,
    leader_id: string,
    player_loadout: {
        token_id: string,
        position: Vector2,
    }[]
}

export type NotifyRoomRequest = FunctionRequest & {
    publickey: string,
}

export enum LockType {
    Battle = 0,
}