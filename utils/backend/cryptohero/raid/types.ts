import { DifficultyType, StatStruct } from "../dungeon/types";

// info of each attack
export class BossAttackStruct {
    constructor(
        public attackingBoss: boolean,
        public playerIndex: number,
        public damage: number,
        public lifeSteal: number,
        public critted: boolean,
        public dodged: boolean,
        public playerDied: boolean,
        public bossDied: boolean,
    ) { }
}

export class BossFightStruct {
    constructor(
        public bossStatStruct: StatStruct,
        public bossAttackStructs: BossAttackStruct[] = [],
        public victory: boolean,
    ) { }
}

export class RoomData {
    constructor(
        public account_id: string,
        public week_code: string,
        public difficulty: DifficultyType,
        public playerNames: string[] = [],
        public playerClasses: number[] = [],
        public playerLevels: number[] = [],
        public playerRanks: number[] = [],
        public playerBossKills: number[] = [],
        public playerEquippedItems: number[][] = [],
        public playerStatStructs: StatStruct[] = [],
        public playerJoinTimestamps: number[] = [],
        public created_at: Date = new Date(),
        public last_fight: number = 0,
        public boss_kills: number = 0,
    ) { }
}