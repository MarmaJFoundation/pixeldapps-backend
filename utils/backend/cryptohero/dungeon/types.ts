
// stats of each monster
export class StatStruct {
    constructor(
        public maxHealth: number,
        public damage: number,
        public defense: number,
        public dodge: number,
        public lifeSteal: number,
        public critChance: number,
    ) { }
}

// info of each attack
export class DungeonAttackStruct {
    constructor(
        public attackingMonster: boolean,
        public monsterIndex: number,
        public damage: number,
        public lifeSteal: number,
        public critted: boolean,
        public dodged: boolean,
        public playerDied: boolean,
        public monsterDied: boolean,
    ) { }
}

// info of each round of monsters
export class DungeonRoundStruct {
    constructor(
        public roundMonsterTypes: MonsterType[] = [],
        public roundMonsterStats: StatStruct[] = [],
        public roundAttacks: DungeonAttackStruct[] = [],
    ) { }
}

// info of each dungeon level
export class DungeonLevelStruct {
    constructor(
        public dungeonRoundStructs: DungeonRoundStruct[] = [],
    ) { }
}

// info of all rounds + result
export class DungeonFightStruct {
    constructor(
        public victory: boolean,
        public levelStructs: DungeonLevelStruct[] = [],
        public itemDrop: ItemData,
    ) { }
}

export class ItemData {
    constructor(
        public item_type: number,
        public rarity_type: number,
        public equip_type: number,
        public class_type: number,
        public strength: number,
        public endurance: number,
        public dexterity: number,
        public intelligence: number,
        public luck: number,
    ) { }
}

export class MonsterData {
    constructor(
        public monster_type: number,
        public class_type: number,
        public dex_range: number[],
        public str_range: number[],
        public end_range: number[],
        public int_range: number[],
        public lck_range: number[],
    ) { }
}

export enum RarityType {
    Common = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3,
    None = 4,
}

export enum ClassType {
    None = 0,
    Mage = 1,
    Knight = 2,
    Ranger = 3
}

export enum EquipType {
    Armor = 0,
    Helmet = 1,
    Weapon = 2,
    Boots = 3,
    Necklace = 4,
    Ring = 5,
    Empty = 6
}

export enum MonsterType {
    None = 0,
    Goblin1 = 1,
    Goblin2 = 2,
    Goblin3 = 3,
    GoblinBoss = 4,
    Rat1 = 5,
    Rat2 = 6,
    RatBoss = 7,
    Demon1 = 8,
    Demon2 = 9,
    DemonBoss = 10,
    Reaper1 = 11,
    Reaper2 = 12,
    ReaperBoss = 13,
    Boss1 = 14,
    Boss2 = 15,
    Boss3 = 16,
    Boss4 = 17,
}

export enum DifficultyType {
    Easy = 0,
    Medium = 1,
    Hard = 2,
    Hell = 3,
}

export enum PotionType {
    Strength = 0,
    Stamina = 1,
    Luck = 2,
}