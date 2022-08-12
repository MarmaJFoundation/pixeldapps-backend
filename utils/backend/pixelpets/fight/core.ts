import {
    getRandomNumber,
    clamp,
} from '../../common/utils'

import type {
    PlayerData, PlayerLoadoutData,
} from '../helper/types'

import {
    BattleInfo,
    PlayerInfo,
} from './types'

import {
    generatePlayerInfo,
    getExpForLevel,
    generateCardStats,
} from './utils'

import {
    getCreatureData,
} from './utils'

import {
    calculateDamageOnDefense,
    calculateMagicOnResistance,
} from './utils'

import {
    isPlayerAlive,
    isBothPlayersAlive,
    getWinnerAccountName,
} from './utils'

import {
    getExpectedRating,
    getNewRating,
} from './utils'

import {
    LoadoutSize,
    PetMaxLevel,
    PetExpGain,
} from './utils'

export function generateBattleInfo(player_one: PlayerData, player_two: PlayerData): BattleInfo {
    const p1 = generatePlayerInfo(player_one)
    const p2 = generatePlayerInfo(player_two)
    const battleInfo = new BattleInfo(p1, p2)
    let multiplier = 100;// handicap multiplier

    // if (player_one.player_rating >= 3000) {
    //     multiplier += clamp(Math.round((player_one.player_rating - 2980) * .05), 0, Infinity)
    // }

    for (let i = 0; i < LoadoutSize; i++) {
        const playerInfo1 = battleInfo.playerInfo1
        const creatureData = getCreatureData(playerInfo1.creatureTypes[i])

        battleInfo.player1CardStats[i] = generateCardStats(
            creatureData,
            playerInfo1.rarityTypes[i] + 1,
            playerInfo1.creatureTrainLevels[i],
            playerInfo1.creatureLevels[i],
            creatureData.evolution,
            playerInfo1.creaturePowerLevels[i],
        )
    }

    for (let i = 0; i < LoadoutSize; i++) {
        const playerInfo2 = battleInfo.playerInfo2
        const creatureData = getCreatureData(playerInfo2.creatureTypes[i])

        battleInfo.player2CardStats[i] = generateCardStats(
            creatureData,
            playerInfo2.rarityTypes[i] + 1,
            playerInfo2.creatureTrainLevels[i],
            playerInfo2.creatureLevels[i],
            creatureData.evolution,
            playerInfo2.creaturePowerLevels[i],
            false,
            multiplier,
        )
    }

    while (isBothPlayersAlive(battleInfo)) {
        for (let i = 0; i < LoadoutSize; i++) {
            if (battleInfo.player1CardStats[i].health > 0 && isPlayerAlive(battleInfo.player2CardStats)) {
                let enemyIndex = getRandomNumber(0, LoadoutSize)
                while (battleInfo.player2CardStats[enemyIndex].health <= 0) {
                    enemyIndex = (enemyIndex + 1) % LoadoutSize
                }
                battleInfo.defenderIndexes.push(i)
                battleInfo.attackerIndexes.push(enemyIndex)
                battleInfo.allyTurn.push(true)
                rawExecuteAttack(battleInfo, i, enemyIndex, true)
            }

            if (battleInfo.player2CardStats[i].health > 0 && isPlayerAlive(battleInfo.player1CardStats)) {
                let enemyIndex = getRandomNumber(0, LoadoutSize)
                while (battleInfo.player1CardStats[enemyIndex].health <= 0) {
                    enemyIndex = (enemyIndex + 1) % LoadoutSize
                }
                battleInfo.defenderIndexes.push(enemyIndex)
                battleInfo.attackerIndexes.push(i)
                battleInfo.allyTurn.push(false)
                rawExecuteAttack(battleInfo, enemyIndex, i, false)
            }
        }
    }

    battleInfo.winnerAccountName = getWinnerAccountName(battleInfo)
    return battleInfo
}

function rawExecuteAttack(battleInfo: BattleInfo, p1CardIndex: number, p2CardIndex: number, player1Attacking: boolean): void {
    if (player1Attacking) {
        if (battleInfo.player2CardStats[p2CardIndex].speed > getRandomNumber(0, 3000)) {
            battleInfo.damageDealt.push(-1)
        }
        else {
            const magicDamage = calculateMagicOnResistance(
                battleInfo.playerInfo2.creatureTypes[p2CardIndex],
                battleInfo.playerInfo1.creatureTypes[p1CardIndex],
                battleInfo.player1CardStats[p1CardIndex].magic
            )
            const physicalDamage = calculateDamageOnDefense(
                battleInfo.player2CardStats[p2CardIndex].defense,
                battleInfo.player1CardStats[p1CardIndex].damage
            )
            const finalDamage = magicDamage + physicalDamage

            battleInfo.player2CardStats[p2CardIndex].health -= finalDamage
            battleInfo.damageDealt.push(finalDamage)
        }
    }
    else {
        if (battleInfo.player1CardStats[p1CardIndex].speed > getRandomNumber(0, 3000)) {
            battleInfo.damageDealt.push(-1)
        }
        else {
            const magicDamage = calculateMagicOnResistance(
                battleInfo.playerInfo1.creatureTypes[p1CardIndex],
                battleInfo.playerInfo2.creatureTypes[p2CardIndex],
                battleInfo.player2CardStats[p2CardIndex].magic
            )
            const physicalDamage = calculateDamageOnDefense(
                battleInfo.player1CardStats[p1CardIndex].defense,
                battleInfo.player2CardStats[p2CardIndex].damage
            )
            const finalDamage = magicDamage + physicalDamage

            battleInfo.player1CardStats[p1CardIndex].health -= finalDamage
            battleInfo.damageDealt.push(finalDamage)
        }
    }
}

function givePetsExperience(player_data: PlayerData, enemy_loadout: PlayerLoadoutData[], player_won: boolean): number {
    const player_levels_avg = Math.round(player_data.player_loadout.map(x => x.pet_level).reduce((sum, current) => sum + current) / LoadoutSize)
    const enemys_levels_avg = Math.round(enemy_loadout.map(x => x.pet_level).reduce((sum, current) => sum + current) / LoadoutSize)
    const __diff_levels_avg = player_levels_avg - enemys_levels_avg
    let finalXp = PetExpGain
    if (player_won && __diff_levels_avg > 0) {
        finalXp = clamp(finalXp - (__diff_levels_avg * 3), 15, PetExpGain)
        if (finalXp == 0) {
            return 0
        }
    }
    for (let i = 0; i < LoadoutSize; i++) {
        const loadoutData = player_data.player_loadout[i]
        if (loadoutData.pet_level < PetMaxLevel) {
            loadoutData.pet_experience += finalXp
            if (loadoutData.pet_experience >= getExpForLevel(loadoutData.pet_level)) {
                // loadoutData.pet_experience = 0// this is done in simulate-fight now
                loadoutData.pet_level++
            }
        }
    }
    return finalXp
}

export function updatePlayersAfterBattle(winner_player: PlayerData, loser_player: PlayerData, player_won: boolean): number {
    // scale player's pets
    const expGainWinner = givePetsExperience(winner_player, loser_player.player_loadout, true)
    const expGainLoser = givePetsExperience(loser_player, winner_player.player_loadout, false)

    // calculate players new rating
    const winner_expected = getExpectedRating(loser_player.player_rating - winner_player.player_rating)
    const winner_rating = getNewRating(winner_player.player_rating, winner_expected, true)

    const loser_expected = getExpectedRating(winner_player.player_rating - loser_player.player_rating)
    const loser_rating = getNewRating(loser_player.player_rating, loser_expected, false)

    // set players new rating
    winner_player.player_rating = clamp(winner_rating, 0, 65535)
    winner_player.matches_won++

    loser_player.player_rating = clamp(loser_rating, 0, 65535)
    loser_player.matches_lost++

    return player_won ? expGainWinner : expGainLoser
}

export function updatePlayersCardStats(battleInfo: BattleInfo): void {
    // Ed does this in client, I don't know the need
    for (let i = 0; i < LoadoutSize; i++) {
        battleInfo.player1CardStats[i].health = battleInfo.player1CardStats[i].maxHealth
        battleInfo.player2CardStats[i].health = battleInfo.player2CardStats[i].maxHealth
    }
}

export function getPreviousPlayerData(player_data: PlayerData, player_info: PlayerInfo): { rating: number, pets: Array<{ level: number, exp: number }> } {
    const prevPetInfo = player_data.player_loadout.map(x => {
        return {
            level: x.pet_level,
            exp: x.pet_experience,
        }
    })
    return {
        rating: player_data.player_rating,
        pets: prevPetInfo,
    }
}