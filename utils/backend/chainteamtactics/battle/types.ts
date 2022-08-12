import { Vector2 } from "../../common/utils";
import { PlayerLoadoutData } from "../helper/types";
import { getUnitByType } from "../helper/utils";

/*
 * main enums
 */

export enum MapType {
    Bridge = 0,
    Temple = 1,
    Volcano = 2,
    Tavern = 3,
}

export enum TileType {
    None = 0,
    Water = 1,
    Lava = 2,
    Earth = 3,
    Marble = 4,
    Grass = 5,
    Stone = 6,
    Wood = 7,
    BlockProp = 8,
    BlockWater = 9,
    BlockMarble = 10,
}

export enum UnitType {
    None = 0,
    Squire = 1,
    Knight = 2,
    Mage = 3,
    Chemist = 4,
    Executioner = 5,
    Marksman = 6,
    Priest = 7,
    Warlock = 8,
    Druid = 9,
    Bard = 10,
    Assassin = 11,
    Elementalist = 12,
    Necromancer = 13,
    Paladin = 14,
    TimeBender = 15,
    Skeleton = 16,
    Wolf = 17,
}

export enum TierType {
    Tier1 = 0,
    Tier2 = 1,
    Tier3 = 2,
    Tier4 = 3,
    None = 4,
}

/*
 * db types
 */

export class UnitData {
    public unit_type: UnitType;
    public unit_tier: number;
    public summon: boolean;
    public supports: boolean;
    public dontRun: boolean;
    public self_cast: boolean;
    public attack_range: number;
    public health: number;
    public damage: number;
    public speed: number;
    public area_of_effect: number;
    public attack_speed: number;
}

export class MapData {
    public map_type: MapType;
    public tile_infos: TileInfo[] = [];
}

export class TileInfo {
    public tile_type: TileType;
    public blocked: boolean;
    public position: Vector2;
}

/*
 * battle types
 */

export class FightNode {
    public position: Vector2;
    public tileType: TileType;
    public blocked: boolean;
    public unit: UnitFightInfo;
    public bodies: UnitFightInfo[];
}

export class UnitInfo {
    public unitID: number;
    public unitType: UnitType;
    public speed: number;
    public damage: number;
    public health: number;
}

export class UnitFightInfo {
    private scriptableUnit: UnitData;
    public currentHealth: number;

    public targetNode: FightNode = null;
    public attackBuff: number = 0;
    public speedBuff: number = 0;
    public turnDelay: number = 0;
    public turnStep: number = 0;

    public justAttacked: boolean = false;
    public attackDelay: number = 0;
    public attackBuffDelay: number = 0;
    public speedBuffDelay: number = 0;

    public attentionDelay: number = 0;
    public deathDelay: number = 0;

    constructor(
        public unitInfo: UnitInfo,
        public isPurple: boolean,
        public currentNode: FightNode,
        public cooldown: number,
    ) {
        this.scriptableUnit = getUnitByType(unitInfo.unitType);
        this.currentHealth = unitInfo.health;
    }

    /*
     * properties
     */

    UnitID(): number {
        return this.unitInfo.unitID;
    }

    Floats(): boolean {
        return this.unitInfo.unitType == UnitType.Warlock;
    }

    Reviver(): boolean {
        return this.unitInfo.unitType == UnitType.Necromancer || this.unitInfo.unitType == UnitType.Priest;
    }

    MaxHealth(): number {
        return this.unitInfo.health;
    }

    CurrentDamage(): number {
        return this.unitInfo.damage + this.attackBuff;
    }

    CurrentSpeed(): number {
        return this.speedBuff > 0 ?
            this.unitInfo.speed * (this.speedBuff + 1) :
            this.unitInfo.speed / (this.speedBuff * -1 + 1);
    }

    /*
     * scriptable data
     */

    unitType(): UnitType {
        return this.scriptableUnit.unit_type;
    }

    selfCast(): boolean {
        return this.scriptableUnit.self_cast;
    }

    supports(): boolean {
        return this.scriptableUnit.supports;
    }

    dontRun(): boolean {
        return this.scriptableUnit.dontRun;
    }

    areaOfEffect(): number {
        return this.scriptableUnit.area_of_effect;
    }

    attackSpeed(): number {
        return this.scriptableUnit.attack_speed;
    }

    attackRange(): number {
        return this.scriptableUnit.attack_range;
    }

    speed(): number {
        return this.scriptableUnit.speed;
    }

    damage(): number {
        return this.scriptableUnit.damage;
    }

    maxHealth(): number {
        return this.scriptableUnit.health;
    }
}

export interface IActionStruct {
    unitID: number;
    moveToNode: Vector2;
    targetNode: Vector2;
    targets: number[];
    damage: number;
}

export class ActionStruct {
    public unitID: number;
    public moveToNode: Vector2;
    public targetNode: Vector2;
    public targets: number[];
    public damage: number;

    constructor();// https://stackoverflow.com/a/12702786
    constructor(actionStruct: IActionStruct);
    constructor(actionStruct?: IActionStruct) {
        this.unitID = actionStruct?.unitID || 0;
        this.moveToNode = actionStruct?.moveToNode || null;
        this.targetNode = actionStruct?.targetNode || null;
        this.targets = actionStruct?.targets || null;
        this.damage = actionStruct?.damage || 0;
    }
}

export class FightStruct {
    public purpleWins: boolean;
    public playerNames: string[];
    public playerRanks: number[];
    public playerLoadouts: PlayerLoadoutData[][];
    public actionStructs: ActionStruct[];
}

export class UnitBehaviorResult {
    public success: boolean;
    public actionStruct: ActionStruct;
}

export class ResolveActionOnNodeResult {
    public targetID: number;
    public fightNode: FightNode;
}

/*interface ISerializable<T> {
    serialize(value: T): Uint8Array;
}

export class ActionStructSerializer implements ISerializable<ActionStruct[]> {
    serialize(value: ActionStruct[]): Uint8Array {
        let buffer: number[] = [];
        let position: number = 0;

        position += write_u16(buffer, position, value.length);

        for (let i: number = 0; i < value.length; i++) {
            const current: ActionStruct = value[i];
            let flags: number = 0;

            if (current.unitID) { flags |= (1 << 0); }
            if (current.moveToNode) { flags |= (1 << 1); }
            if (current.targetNode) { flags |= (1 << 2); }
            if (current.targets) { flags |= (1 << 3); }
            if (current.damage) { flags |= (1 << 4); }

            position += write_u8(buffer, position, flags);

            if ((flags & (1 << 0)) != 0) {
                position += write_u64(buffer, position, current.unitID);
            }

            if ((flags & (1 << 1)) != 0) {
                position += write_u8(buffer, position, current.moveToNode.x);
                position += write_u8(buffer, position, current.moveToNode.y);
            }

            if ((flags & (1 << 2)) != 0) {
                position += write_u8(buffer, position, current.targetNode.x);
                position += write_u8(buffer, position, current.targetNode.y);
            }

            if ((flags & (1 << 3)) != 0) {
                position += write_u8(buffer, position, current.targets.length);
                for (let j: number = 0; j < current.targets.length; j++) {
                    position += write_u64(buffer, position, current.targets[j]);
                }
            }

            if ((flags & (1 << 4)) != 0) {
                position += write_u16(buffer, position, current.damage);
            }
        }

        return new Uint8Array(buffer);
    }
}*/