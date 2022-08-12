import type {
    PlayerData,
    PetType,
} from '../helper/types'

import {
    ElementMatrix,
    BotNames,
} from './types'

import {
    BattleInfo,
    PlayerInfo,
    CardStats,
} from './types'

import {
    CACHED_PETBASE_DATA,
} from '../helper/basic_game'

import {
    getRandomNumber,
    clamp,
    Guid
} from '../../common/utils'

/*
 * constants
 */
export const LoadoutSize: number = 3
export const PetMaxLevel: number = 100
export const PetExpGain: number = 50

/*
 * general utils
 */
export function getRandomBotName(lowerCase: boolean = false, snakeCase: boolean = false, nearSuffix: boolean = true): string {
    let name = BotNames[getRandomNumber(0, BotNames.length)]
    if (lowerCase) {
        name = name.toLowerCase()
    }
    if (snakeCase) {
        name = name.replace(/\s/g, '_')
    }
    if (nearSuffix) {
        name = `${name}.near`
    }
    return name
}

/*
 * creature utils
 */
export function getCreatureData(type: number): PetType {
    return CACHED_PETBASE_DATA.find(x => x.pet_id == type)
}

export function getRandomCreatureType(level: number = 0): number {
    const forbid_types: number[] = [
        20,// Sungen
        65,// Croncat
        66,// Gobbler
    ]
    const noForbidDb: PetType[] = CACHED_PETBASE_DATA.filter(x => !forbid_types.includes(x.pet_id))
    const lvl1Db: PetType[] = noForbidDb.filter(x => x.evolution == 1)
    const index = getRandomNumber(0, lvl1Db.length)

    let petData = lvl1Db[index]
    if (!petData.evolution_to || level < 30) {
        return petData.pet_id
    }

    petData = noForbidDb.find(x => x.pet_id == petData.evolution_to)
    if (!petData.evolution_to || level < 70) {
        return petData.pet_id
    }

    petData = noForbidDb.find(x => x.pet_id == petData.evolution_to)
    return petData.pet_id
}

export function getExpForLevel(level: number): number {
    return Math.round(50 * level * (1 + level * .2))
}

/*
 * combat utils
 */
export function calculateDamageOnDefense(damagedDefense: number, attackDamage: number): number {
    const damageSoak = damagedDefense / 500 * damagedDefense
    const finalDamage = attackDamage - damageSoak
    return finalDamage > 1 ? finalDamage : 1
}

export function calculateMagicOnResistance(damagedType: number, attackerType: number, magicDamage: number): number {
    const magicModifier = getMagicModifier(damagedType, attackerType)
    return Math.round(magicDamage * magicModifier)
}

function getMagicModifier(damagedType: number, attackerType: number): number {
    const bodyType = getCreatureData(damagedType).body_type
    const attackType = getCreatureData(attackerType).damage_type
    return ElementMatrix[attackType][bodyType]
}

//ank pp rarity
export function getModifiedStat(baseStat: number, rarity: number, trainLevel: number, level: number, evolution: number, powerLevel: number): number {
    let rarityModifier: number = 1;
    switch (rarity) {
        case 1:// common
            rarityModifier = 1
            break
        case 2:// rare
            rarityModifier = 1.12
            break
        case 3:// epic
            rarityModifier = 1.20
            break
        default:// legendary
            rarityModifier = 1.30
            break
    }
    const trainLevelModifier = trainLevel * .04
    const levelModifier = level * .03
    const evolutionModifier = evolution * .1
    const powerLevelModifier = (powerLevel - 65) * .02
    const result = (baseStat + (baseStat * evolutionModifier) + (baseStat * trainLevelModifier) + (baseStat * levelModifier) + (baseStat * powerLevelModifier)) * rarityModifier;
    return Math.round(result)
}

/*
 * player utils
 */
export function isPlayerAlive(playerCardStats: CardStats[]): boolean {
    for (let i = 0; i < LoadoutSize; i++) {
        if (playerCardStats[i].health > 0) {
            return true
        }
    }
    return false
}

export function isBothPlayersAlive(battleInfo: BattleInfo): boolean {
    if (!isPlayerAlive(battleInfo.player1CardStats)) {
        return false
    }
    if (!isPlayerAlive(battleInfo.player2CardStats)) {
        return false
    }
    return true
}

export function getWinnerAccountName(battleInfo: BattleInfo): string {
    if (isPlayerAlive(battleInfo.player1CardStats)) {
        return battleInfo.playerInfo1.playerAccount
    }
    if (isPlayerAlive(battleInfo.player2CardStats)) {
        return battleInfo.playerInfo2.playerAccount
    }
    throw 'NotSupposedToHappenException'
}

/**
 * creates a 'PlayerInfo' object from a given 'PlayerData'
 * 
 * 'PlayerInfo' are the player structure used in the fighting
 * 
 * 'PlayerData' are the player structure used by the database
 */
export function generatePlayerInfo(player_data: PlayerData): PlayerInfo {
    const playerInfo = new PlayerInfo(
        player_data.account_id,
        player_data.player_rating,
        player_data.player_loadout.map(x => x.pet_type),
        player_data.player_loadout.map(x => x.pet_rarity),
        player_data.player_loadout.map(x => x.pet_level),
        player_data.player_loadout.map(x => x.pet_trainLevel),
        player_data.player_loadout.map(x => x.pet_power_level),
        player_data.player_loadout.map(x => x.pet_experience),
    )
    return playerInfo
}

export function generateCardStats(pet_type: PetType, rarity: number, train_level: number, level: number, evolution: number, powerLevel: number, include_name: boolean = false, multiplier: number = 100): CardStats {
    const cardStats = {
        maxHealth: getModifiedStat(300, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
        health: getModifiedStat(300, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
        damage: getModifiedStat(pet_type.damage, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
        speed: getModifiedStat(pet_type.speed, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
        defense: getModifiedStat(pet_type.defense, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
        magic: getModifiedStat(pet_type.magic, rarity, train_level, level, evolution, powerLevel) / 100 * multiplier,
    }
    if (include_name) {
        cardStats["name"] = pet_type.pet_name
    }
    return cardStats
}

/**
 * creates a 'PlayerData' object with random values and based on a given 'PlayerData'
 */
export function createBotData(player_data: PlayerData): PlayerData {
    const levelMedium = Math.round(player_data.player_loadout.map(x => x.pet_level).reduce((sum, current) => sum + current) / LoadoutSize)
    const trainLevelMedium = Math.round(player_data.player_loadout.map(x => x.pet_trainLevel).reduce((sum, current) => sum + current) / LoadoutSize)
    const powerLevelMedium = Math.round(player_data.player_loadout.map(x => x.pet_power_level).reduce((sum, current) => sum + current) / LoadoutSize)
    const expMedium = Math.round(player_data.player_loadout.map(x => x.pet_experience).reduce((sum, current) => sum + current) / LoadoutSize)
    const petLevel = Math.round(getRandomNumber(levelMedium * .75, levelMedium * 1.25))
    const bot_data: PlayerData = {
        account_id: getRandomBotName(true, true),
        matches_won: 0,
        matches_lost: 0,
        // player_rating: getRandomNumber(player_data.player_rating * .75, player_data.player_rating * 1.25),// original one
        player_rating: getRandomNumber(player_data.player_rating * .75, player_data.player_rating),// second version, better but can be better
        // player_rating: calculateBotRating(player_data.player_rating),// TODO: review this later
        player_loadout: Array(LoadoutSize).fill(0).map(() => {
            return {
                token_id: Guid.newGuid(),
                pet_type: getRandomCreatureType(petLevel),
                pet_rarity: getRandomNumber(0, 3),
                pet_level: petLevel,
                pet_trainLevel: Math.round(getRandomNumber(trainLevelMedium * .75, trainLevelMedium * 1.25)),
                pet_power_level: Math.round(getRandomNumber(powerLevelMedium * .75, powerLevelMedium * 1.25)),
                pet_experience: Math.round(clamp(getRandomNumber(expMedium * .5, expMedium), 0, Infinity)),
            }
        }),
        last_fight: 0,
    }
    // console.log("BOT '" + bot_data.account_id + "' created!")
    return bot_data
}

function calculateBotRating(player_rating: number): number {
    const mul_rating = 1.0 + (player_rating / 15000)
    const min_rating = player_rating * (.75 / mul_rating)
    const max_rating = player_rating * (1.0 / mul_rating)
    const rnd_rating = getRandomNumber(min_rating, max_rating)
    return rnd_rating
}

/*
 * rating utils
 * original code from 'Oldage'
 */
export function getExpectedRating(ratingDifference: number): number {
    return 1.0 / (1.0 + Math.pow(10.0, ratingDifference / 400.0))
}

// commented numbers and draw param are from 'Oldage' - they are not used here
export function getNewRating(prevRating: number, expected: number, win: boolean, draw: boolean = false): number {
    let k = 1.0
    if (prevRating < /*2100*/1200) {
        k = 32.0
    } else if ((prevRating >= /*2100*/1200) && (prevRating < /*2400*/1600)) {
        k = 24.0
    } else {
        k = 16.0
    }
    if (draw) {
        return prevRating + Math.round(k * (0.5 - expected))
    } else if (win) {
        let finalRating = prevRating + Math.round(k * (1.0 - expected))
        const finalRatingGain = finalRating - prevRating
        if (finalRatingGain >= 0 && finalRatingGain < 3) {
            finalRating += (3 - finalRatingGain)
        }
        return finalRating
    }
    return prevRating + Math.round(k * (0.0 - expected))
}