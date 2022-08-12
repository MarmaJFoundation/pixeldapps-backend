import { clamp, getRandomFloat, getRandomNumber, getRandomVector2 } from "../../common/utils";
import { GenerateMonsterStatStruct, getItemsByRarity, getMonsterByType } from "../helper/utils";
import { ClassType, DifficultyType, EquipType, ItemData, MonsterType, RarityType, StatStruct } from "./types";

const RarityBaseStats: number[][] = [
    [75, 175],
    [150, 350],
    [300, 500],
    [500, 800],
];

export const EasyDungeonMonsters: MonsterType[] = [
    MonsterType.Goblin1,
    MonsterType.Goblin2,
    MonsterType.Goblin1,
    MonsterType.Goblin2,
    MonsterType.Goblin3,
];

export const MediumDungeonMonsters: MonsterType[] = [
    MonsterType.Rat1,
    MonsterType.Rat2,
];

export const HardDungeonMonsters: MonsterType[] = [
    MonsterType.Demon1,
    MonsterType.Demon2,
];

export const HellDungeonMonsters: MonsterType[] = [
    MonsterType.Reaper1,
    MonsterType.Reaper2,
];

export function GenerateItemStatStruct(itemData: ItemData, classType: ClassType, equipType: EquipType): StatStruct {
    let damage = 0;
    let defense = 0;
    let critChance = 0;
    let lifeSteal = 0;
    let dodge = 0;
    let maxHealth = 0;

    switch (classType) {
        case ClassType.Mage:
            switch (equipType) {
                case EquipType.Armor:
                    defense = (itemData.strength + itemData.endurance) * .01;
                    maxHealth = 1 + Math.round(itemData.endurance * 1.75 + itemData.intelligence + itemData.luck);
                    dodge = (itemData.dexterity + itemData.luck) * .01;
                    break;

                case EquipType.Helmet:
                    defense = (itemData.strength + itemData.endurance) * .01;
                    damage = 1 + Math.round((itemData.luck + itemData.intelligence) * .2);
                    break;

                case EquipType.Weapon:
                    damage = 1 + Math.round((itemData.luck + itemData.intelligence + itemData.dexterity + itemData.strength) * .25);
                    critChance = (itemData.intelligence + itemData.luck) * .01;
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;

                case EquipType.Boots:
                    dodge = .01 + (itemData.dexterity + itemData.luck) * .01;
                    defense = (itemData.strength + itemData.endurance) * .01;
                    break;

                case EquipType.Necklace:
                    maxHealth = 1 + Math.round((itemData.endurance + itemData.intelligence) * .5);
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;

                case EquipType.Ring:
                    critChance = (itemData.intelligence + itemData.luck) * .01;
                    lifeSteal = .01 + (itemData.intelligence + itemData.luck) * .005;
                    break;
            }
            break;

        case ClassType.Knight:
            switch (equipType) {
                case EquipType.Armor:
                    defense = (itemData.strength + itemData.endurance) * .015;
                    maxHealth = 1 + Math.round(itemData.endurance * 2.25 + itemData.strength + itemData.luck);
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;

                case EquipType.Helmet:
                    defense = (itemData.strength + itemData.endurance) * .01;
                    maxHealth = 1 + Math.round(itemData.endurance * 1.5 + itemData.strength);
                    break;

                case EquipType.Weapon:
                    damage = 1 + Math.round((itemData.luck + itemData.strength + itemData.dexterity + itemData.intelligence) * .25);
                    critChance = (itemData.strength + itemData.luck) * .01;
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;

                case EquipType.Boots:
                    defense = .01 + (itemData.strength + itemData.endurance) * .01;
                    dodge = (itemData.dexterity + itemData.luck) * .01;
                    break;

                case EquipType.Necklace:
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    defense = .01 + (itemData.strength + itemData.endurance) * .01;
                    break;

                case EquipType.Ring:
                    critChance = (itemData.strength + itemData.luck) * .01;
                    maxHealth = 1 + Math.round((itemData.endurance + itemData.luck) * .75);
                    break;
            }
            break;

        case ClassType.Ranger:
            switch (equipType) {
                case EquipType.Armor:
                    dodge = (itemData.dexterity + itemData.intelligence) * .01;
                    maxHealth = 1 + Math.round(itemData.endurance * 2 + itemData.dexterity + itemData.luck);
                    defense = (itemData.strength + itemData.endurance) * .01;
                    break;

                case EquipType.Helmet:
                    defense = .01 + (itemData.strength + itemData.endurance) * .01;
                    dodge = (itemData.dexterity + itemData.luck) * .01;
                    break;

                case EquipType.Weapon:
                    damage = 1 + Math.round((itemData.luck + itemData.dexterity + itemData.strength + itemData.intelligence) * .25);
                    critChance = (itemData.dexterity + itemData.luck) * .01;
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;

                case EquipType.Boots:
                    defense = (itemData.strength + itemData.endurance) * .01;
                    dodge = .01 + (itemData.dexterity + itemData.luck) * .01;
                    break;

                case EquipType.Necklace:
                    maxHealth = 1 + Math.round((itemData.endurance + itemData.dexterity) * .5);
                    critChance = (itemData.dexterity + itemData.luck) * .01;
                    break;

                case EquipType.Ring:
                    damage = 1 + Math.round((itemData.luck + itemData.dexterity) * .2);
                    lifeSteal = (itemData.intelligence + itemData.luck) * .005;
                    break;
            }
            break;
    }

    // clamping to not exceed 100%
    defense = clamp(defense, 0, 100);
    critChance = clamp(critChance, 0, 100);
    lifeSteal = clamp(lifeSteal, 0, 100);
    dodge = clamp(dodge, 0, 100);

    return new StatStruct(
        maxHealth,
        damage,
        defense,
        dodge,
        lifeSteal,
        critChance
    );
}

export function GenerateRandomItem(rarityType: RarityType, itemType: number = -1): ItemData {
    const itemsByRarity = getItemsByRarity(rarityType);
    const itemIndex = getRandomNumber(0, itemsByRarity.length);
    const itemData = itemType != -1 ? itemsByRarity.find(x => x.item_type == itemType) : itemsByRarity[itemIndex];
    const rarityBaseStat = RarityBaseStats[rarityType];

    let strength = getRandomVector2(rarityBaseStat);
    let endurance = getRandomVector2(rarityBaseStat);
    let dexterity = getRandomVector2(rarityBaseStat);
    let intelligence = getRandomVector2(rarityBaseStat);
    let luck = getRandomVector2(rarityBaseStat);

    for (let i = 0; i < 10; i++) {
        if ((strength + endurance + dexterity + intelligence + luck) > rarityBaseStat[1]) {
            strength -= getRandomNumber(10, 50);
            endurance -= getRandomNumber(10, 50);
            dexterity -= getRandomNumber(10, 50);
            intelligence -= getRandomNumber(10, 50);
            luck -= getRandomNumber(10, 50);
        }
    }

    strength = clamp(strength, 0, Infinity);
    endurance = clamp(endurance, 0, Infinity);
    dexterity = clamp(dexterity, 0, Infinity);
    intelligence = clamp(intelligence, 0, Infinity);
    luck = clamp(luck, 0, Infinity);

    return new ItemData(
        itemData.item_type,
        rarityType,
        itemData.equip_type,
        itemData.class_type,
        strength,
        endurance,
        dexterity,
        intelligence,
        luck
    );
}

export function GenerateMonsterStats(difficulty: DifficultyType, charStruct: StatStruct, monsterType: MonsterType): StatStruct {
    const monsterData = getMonsterByType(monsterType);
    const statSum = Math.round(charStruct.critChance * 100) + Math.round(charStruct.lifeSteal * 100) + Math.round(charStruct.dodge * 100) + Math.round(charStruct.defense * 100) + charStruct.damage + charStruct.maxHealth / 2;
    const multiplier = getRandomFloat(.01, .02) / (1 + statSum * .001);
    const statAdd = Math.round(clamp(statSum - 250, 1, Infinity) * multiplier);
    const statMultiplier = 1 + (statSum / 6 * multiplier) + (difficulty * .1);
    const dexterity = Math.round((getRandomVector2(monsterData.dex_range) + statAdd) * statMultiplier);
    const strength = Math.round((getRandomVector2(monsterData.str_range) + statAdd) * statMultiplier);
    const intelligence = Math.round((getRandomVector2(monsterData.int_range) + statAdd) * statMultiplier);
    const endurance = Math.round((getRandomVector2(monsterData.end_range) + statAdd) * statMultiplier);
    const luck = Math.round((getRandomVector2(monsterData.lck_range) + statAdd) * statMultiplier);
    return GenerateMonsterStatStruct(monsterData.class_type, dexterity, strength, intelligence, endurance, luck);
}