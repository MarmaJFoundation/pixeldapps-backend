import { getRandomFloat, getRandomNumber } from "../../common/utils";
import { PotionData } from "../helper/types";
import { GetPotionData } from "../helper/utils";
import { DifficultyType, DungeonAttackStruct, DungeonFightStruct, DungeonLevelStruct, DungeonRoundStruct, ItemData, MonsterType, PotionType, RarityType, StatStruct } from "./types";
import { EasyDungeonMonsters, GenerateMonsterStats, GenerateRandomItem, HardDungeonMonsters, HellDungeonMonsters, MediumDungeonMonsters } from "./utils";

function calculateChanceWithLuck(chance: number, luck: number) {
    return chance + (chance * luck * 0.01);
}

export function GenerateFightStruct(difficulty: DifficultyType, charStruct: StatStruct, potions_data: PotionData[]): DungeonFightStruct {
    const levelStructs: DungeonLevelStruct[] = [];
    const rarityChance = getRandomFloat(0, 100);
    let rarityType: RarityType = RarityType.Common;// default rarity for DifficultyType.Easy
    let potionLuck: number = 0;

    const potionData = GetPotionData(potions_data, PotionType.Luck);
    if (potionData) {
        potionLuck = potionData.strength;
    }

    switch (difficulty) {
        case DifficultyType.Medium:
            if (rarityChance < calculateChanceWithLuck(10, potionLuck)) {
                rarityType = RarityType.Rare;
            }
            break;

        case DifficultyType.Hard:
            if (rarityChance < calculateChanceWithLuck(1, potionLuck)) {
                rarityType = RarityType.Epic;
            }
            else if (rarityChance < calculateChanceWithLuck(15, potionLuck)) {
                rarityType = RarityType.Rare;
            }
            break;

        case DifficultyType.Hell:
            if (rarityChance < calculateChanceWithLuck(1, potionLuck)) {
                rarityType = RarityType.Legendary;
            }
            else if (rarityChance < calculateChanceWithLuck(5, potionLuck)) {
                rarityType = RarityType.Epic;
            }
            else if (rarityChance < calculateChanceWithLuck(25, potionLuck)) {
                rarityType = RarityType.Rare;
            }
            break;
    }

    const dropItem: ItemData = GenerateRandomItem(rarityType);
    let charHP = charStruct.maxHealth;

    for (let i = 0; i < 4; i++) {
        const roundStructs: DungeonRoundStruct[] = [];
        const bossRound = i == 3;
        const monstersWaves = bossRound ? 1 : 2;

        for (let j = 0; j < monstersWaves; j++) {
            const roundMonstersStats: StatStruct[] = [];
            const roundMonstersTypes: MonsterType[] = [];
            const roundAttacks: DungeonAttackStruct[] = [];
            const monstersHP: number[] = [];

            switch (difficulty) {
                case DifficultyType.Easy:
                    if (bossRound) {
                        roundMonstersTypes.push(MonsterType.GoblinBoss);
                    }
                    else {
                        for (let k = 0; k < 3; k++) {
                            roundMonstersTypes.push(EasyDungeonMonsters[getRandomNumber(0, EasyDungeonMonsters.length)]);
                        }
                    }
                    break;

                case DifficultyType.Medium:
                    if (bossRound) {
                        roundMonstersTypes.push(MonsterType.RatBoss);
                    }
                    else {
                        for (let k = 0; k < 3; k++) {
                            roundMonstersTypes.push(MediumDungeonMonsters[getRandomNumber(0, MediumDungeonMonsters.length)]);
                        }
                    }
                    break;

                case DifficultyType.Hard:
                    if (bossRound) {
                        roundMonstersTypes.push(MonsterType.DemonBoss);
                    }
                    else {
                        for (let k = 0; k < 3; k++) {
                            roundMonstersTypes.push(HardDungeonMonsters[getRandomNumber(0, HardDungeonMonsters.length)]);
                        }
                    }
                    break;

                case DifficultyType.Hell:
                    if (bossRound) {
                        roundMonstersTypes.push(MonsterType.ReaperBoss);
                    }
                    else {
                        for (let k = 0; k < 3; k++) {
                            roundMonstersTypes.push(HellDungeonMonsters[getRandomNumber(0, HellDungeonMonsters.length)]);
                        }
                    }
                    break;
            }

            for (let l = 0; l < roundMonstersTypes.length; l++) {
                roundMonstersStats.push(GenerateMonsterStats(difficulty, charStruct, roundMonstersTypes[l]));
            }

            for (let l = 0; l < roundMonstersStats.length; l++) {
                monstersHP.push(roundMonstersStats[l].maxHealth);
            }

            let monstersAlive = roundMonstersStats.length;

            while (monstersAlive > 0) {
                let damage = 0;
                let critted = false;
                let dodged = false;
                let lifeSteal = 0;

                for (let l = 0; l < roundMonstersStats.length; l++) {
                    if (monstersHP[l] <= 0) {
                        continue;
                    }

                    // monster attacks players
                    critted = false;
                    damage = 0;
                    lifeSteal = 0;
                    dodged = getRandomFloat(0, 100) < charStruct.dodge;

                    if (!dodged) {
                        damage = Math.round(getRandomFloat(roundMonstersStats[l].damage * .5, roundMonstersStats[l].damage));
                        critted = getRandomFloat(0, 100) < roundMonstersStats[l].critChance;

                        if (critted) {
                            damage *= 2;
                        }

                        damage -= Math.round(damage * getRandomFloat(charStruct.defense * .5, charStruct.defense * .9) / 100);
                        lifeSteal = Math.round(damage / 100 * roundMonstersStats[l].lifeSteal);

                        if ((lifeSteal + monstersHP[l]) >= roundMonstersStats[l].maxHealth) {
                            lifeSteal -= (lifeSteal + monstersHP[l]) - roundMonstersStats[l].maxHealth;
                        }

                        monstersHP[l] += lifeSteal;
                        charHP -= damage;
                    }

                    roundAttacks.push(new DungeonAttackStruct(false, l, damage, lifeSteal, critted, dodged, charHP <= 0, false));

                    // if player dies, stop everything here
                    if (charHP <= 0) {
                        roundStructs.push(new DungeonRoundStruct(roundMonstersTypes, roundMonstersStats, roundAttacks));
                        levelStructs.push(new DungeonLevelStruct(roundStructs));
                        return new DungeonFightStruct(false, levelStructs, dropItem);
                    }

                    // player attacks monster
                    critted = false;
                    damage = 0;
                    lifeSteal = 0;
                    dodged = getRandomFloat(0, 100) < roundMonstersStats[l].dodge;

                    if (!dodged) {
                        damage = Math.round(getRandomFloat(charStruct.damage * .5, charStruct.damage));
                        critted = getRandomFloat(0, 100) < charStruct.critChance;

                        if (critted) {
                            damage *= 2;
                        }

                        damage -= Math.round(damage * getRandomFloat(roundMonstersStats[l].defense * .5, roundMonstersStats[l].defense * .9) / 100);
                        lifeSteal = Math.round(damage / 100 * charStruct.lifeSteal);

                        if ((lifeSteal + charHP) >= charStruct.maxHealth) {
                            lifeSteal -= (lifeSteal + charHP) - charStruct.maxHealth;
                        }

                        charHP += lifeSteal;
                        monstersHP[l] -= damage;
                    }

                    roundAttacks.push(new DungeonAttackStruct(true, l, damage, lifeSteal, critted, dodged, false, monstersHP[l] <= 0));

                    if (monstersHP[l] <= 0) {
                        monstersAlive--;
                    }
                }
            }

            roundStructs.push(new DungeonRoundStruct(roundMonstersTypes, roundMonstersStats, roundAttacks));
        }

        levelStructs.push(new DungeonLevelStruct(roundStructs));
    }

    return new DungeonFightStruct(true, levelStructs, dropItem);
}