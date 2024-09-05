import { clamp, is_testnet_env, ONE_HOUR_IN_NS, ONE_MINUTE_IN_NS, ONE_NANO_SECOND } from "../../common/utils";
import { ClassType, DifficultyType, ItemData, MonsterData, PotionType, StatStruct } from "../dungeon/types";
import { GenerateItemStatStruct } from "../dungeon/utils";
import { CACHED_ITEMBASE_DATA, CACHED_MONSTERBASE_DATA, getItemBaseData, getMonsterBaseData } from "./basic_game";
import { CharacterData, PlayerData, PotionData } from "./types";

export const CharMaxLevel: number = 100;
export const MaxItems: number = 60;

export function getItemByType(itemType: number): ItemData {
    return CACHED_ITEMBASE_DATA.find(x => x.item_type == itemType);
}

export function getItemsByRarity(rarityType: number): ItemData[] {
    return CACHED_ITEMBASE_DATA.filter(x => x.rarity_type == rarityType);
}

export function getMonsterByType(monsterType: number): MonsterData {
    return CACHED_MONSTERBASE_DATA.find(x => x.monster_type == monsterType);
}

export async function generateCharacterInfo(player_data: PlayerData): Promise<StatStruct> {
    const itemBaseData = await getItemBaseData();
    await getMonsterBaseData();// ensure cache

    const itemsData = player_data.player_inventory.map<ItemData>(item => {
        const x = itemBaseData.find(x => x.item_type == item.item_type);
        return {
            item_type: item.item_type,
            rarity_type: item.rarity_type,
            equip_type: x.equip_type,
            class_type: x.class_type,
            strength: item.strength,
            endurance: item.endurance,
            dexterity: item.dexterity,
            intelligence: item.intelligence,
            luck: item.luck,
        }
    });

    const charStatStruct = GenerateCharacterStruct(
        player_data.player_character,
        itemsData
    );

    // console.log("charStatStruct: " + JSON.stringify(charStatStruct));
    return charStatStruct;
}

export function GenerateCharacterStruct(characterData: CharacterData, itemData: ItemData[]): StatStruct {
    let damage = 0;
    let defense = 0;
    let critChance = 0;
    let lifeSteal = 0;
    let dodge = 0;
    let maxHealth = 0;

    switch (characterData.class_type) {
        case ClassType.Mage:
            damage = 15;
            defense = 3;
            critChance = 3;
            lifeSteal = 4;
            dodge = 3;
            maxHealth = 85;
            break;

        case ClassType.Knight:
            damage = 13;
            defense = 5;
            critChance = 3;
            lifeSteal = 3;
            dodge = 3;
            maxHealth = 120;
            break;

        case ClassType.Ranger:
            damage = 14;
            defense = 3;
            critChance = 4;
            lifeSteal = 3;
            dodge = 3;
            maxHealth = 90;
            break;

        default:
            break;
    }

    // add stats from items
    for (let i = 0; i < itemData.length; i++) {
        if (itemData[i].class_type == characterData.class_type) {
            const itemStatStruct = GenerateItemStatStruct(itemData[i], characterData.class_type, itemData[i].equip_type);
            // console.log("itemStatStruct: " + JSON.stringify(itemStatStruct));
            damage += itemStatStruct.damage;
            defense += itemStatStruct.defense;
            critChance += itemStatStruct.critChance;
            lifeSteal += itemStatStruct.lifeSteal;
            dodge += itemStatStruct.dodge;
            maxHealth += itemStatStruct.maxHealth;
        }
    }

    let potionMultiplier: number = 1;
    const potionData = GetPotionData(characterData.potions, PotionType.Strength);

    if (potionData) {
        potionMultiplier += potionData.strength * .01;
    }

    // multiply by level & potion
    damage = Math.round(damage * (1 + (characterData.level * .01)) * potionMultiplier);
    defense = Math.round(defense * (1 + (characterData.level * .01)) * potionMultiplier);
    critChance = Math.round(critChance * (1 + (characterData.level * .01)) * potionMultiplier);
    lifeSteal = Math.round(lifeSteal * (1 + (characterData.level * .01)) * potionMultiplier);
    dodge = Math.round(dodge * (1 + (characterData.level * .01)) * potionMultiplier);
    maxHealth = Math.round(maxHealth * (1 + (characterData.level * .01)) * potionMultiplier);

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

export function GenerateMonsterStatStruct(classType: ClassType, dexterity: number, strength: number, intelligence: number, endurance: number, luck: number): StatStruct {
    let damage = 0;
    let defense = 0;
    let critChance = 0;
    let lifeSteal = 0;
    let dodge = 0;
    let maxHealth = 0;

    switch (classType) {
        case ClassType.Ranger:
            damage = Math.round((luck + dexterity * .3 + strength * .3) * .25);
            defense = (strength + endurance) * .005;
            critChance = (dexterity + luck) * .008;
            lifeSteal = (intelligence + luck) * .005;
            dodge = (dexterity + luck) * .005;
            maxHealth = Math.round(endurance * 1.4);
            break;

        case ClassType.Mage:
            damage = Math.round((luck + intelligence * .7) * .25);
            defense = (strength + endurance) * .004;
            critChance = (intelligence + luck) * .006;
            lifeSteal = (intelligence + luck) * .006;
            dodge = (dexterity + luck) * .006;
            maxHealth = Math.round(endurance * 1.2);
            break;

        case ClassType.Knight:
            damage = Math.round((luck + strength * .5) * .25);
            defense = (strength + endurance) * .008;
            critChance = (strength + luck) * .004;
            lifeSteal = (intelligence + luck) * .004;
            dodge = (dexterity + luck) * .003;
            maxHealth = Math.round(endurance * 1.75);
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

export function GetExpForNextLevel(level: number): number {
    return Math.round(50 * level * (1 + level * .2));
}

export function GetStatRank(statStruct: StatStruct): number {
    const statRank = Math.round(
        statStruct.critChance * 100 + statStruct.defense * 100 + statStruct.dodge * 100 +
        statStruct.maxHealth / 4 + statStruct.lifeSteal * 100 + statStruct.damage
    );
    return statRank;
}

export function GetCharacterRank(statRank: number, level: number): number {
    const characterRank = Math.round(statRank + level * 100);
    return characterRank;
}

export function GetPotionData(potions_data: PotionData[], potion_type: PotionType): PotionData | null {
    const index = potions_data.findIndex(x => x.potion_type == potion_type);
    if (index != -1 && potions_data[index].amount > 0) {
        return potions_data[index];
    }
    return null;
}

export function GetExpGainBasedOnDifficulty(difficulty: DifficultyType, victory: boolean): number {
    let experience: number = 0;

    if (difficulty == DifficultyType.Medium) {
        experience = 40;
    } else if (difficulty == DifficultyType.Hard) {
        experience = 160;
    } else if (difficulty == DifficultyType.Hell) {
        experience = 480;
    } else { DifficultyType.Easy
        experience = 20;
    }

    if (!victory) {
        const percentages: number[] = [0, 5, 15, 30];
        const penalty: number = percentages[difficulty] / 100;

        experience = clamp(experience - experience * penalty, 0, Infinity);
    }

    return experience;
}

export function GetRestingTimerBasedOnDifficulty(difficulty: DifficultyType, potions_data: PotionData[]): number {
    let timer: number = 0;
    let restReduction: number = 0;

    const potionData = GetPotionData(potions_data, PotionType.Stamina);
    if (potionData) {
        restReduction = potionData.strength;
    }

    switch (difficulty) {
        case DifficultyType.Easy:
            timer = ONE_MINUTE_IN_NS * (30 - restReduction);// 30min
            break;

        case DifficultyType.Medium:
            timer = ONE_MINUTE_IN_NS * (60 - restReduction);// 1hour
            break;

        case DifficultyType.Hard:
            timer = ONE_MINUTE_IN_NS * (240 - restReduction);// 4hours
            break;

        case DifficultyType.Hell:
            timer = ONE_MINUTE_IN_NS * (720 - restReduction);// 12hours
            break;
    }

    if (is_testnet_env()) {
        timer = ONE_NANO_SECOND * 15;
    }

    return timer;
}

export function assert_difficulty(difficulty: DifficultyType): void {
    if (difficulty < DifficultyType.Easy || difficulty > DifficultyType.Hell) {
        throw "Invalid difficulty";
    }
}