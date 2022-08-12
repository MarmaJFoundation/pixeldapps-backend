import { clamp, getRandomFloat, getRandomNumber } from "../../common/utils";
import { MonsterType } from "../dungeon/types";
import { BossAttackStruct, BossFightStruct, RoomData } from "./types";
import { GenerateBossStats, HasPlayerAlive } from "./utils";

export function GenerateFightStruct(roomData: RoomData): BossFightStruct {
    const playersCount = roomData.playerStatStructs.length;
    const charHPs: number[] = roomData.playerStatStructs.map(x => x.maxHealth);
    const bossType: MonsterType = MonsterType[`Boss${roomData.difficulty + 1}`];
    const bossStruct = GenerateBossStats(roomData.difficulty + 1, roomData.playerStatStructs, roomData.boss_kills, bossType);
    const bossAttackStructs: BossAttackStruct[] = [];

    let bossHP: number = bossStruct.maxHealth;
    let damage: number = 0;
    let critted: boolean = false;
    let dodged: boolean = false;
    let lifeSteal: number = 0;

    while (HasPlayerAlive(charHPs)) {
        // players attack
        for (let i: number = 0; i < playersCount; i++) {
            const playerStat = roomData.playerStatStructs[i];

            if (charHPs[i] <= 0) {
                continue;
            }

            dodged = false;
            damage = Math.round(getRandomFloat(playerStat.damage * .5, playerStat.damage));
            critted = getRandomFloat(0, 100) < playerStat.critChance;

            if (critted) {
                damage *= 2;
            }

            damage -= Math.round(damage * getRandomFloat(bossStruct.defense * .5, bossStruct.defense * .9) / 100);
            lifeSteal = Math.round(damage / 100.0 * playerStat.lifeSteal);

            if ((lifeSteal + charHPs[i]) >= playerStat.maxHealth) {
                lifeSteal -= (lifeSteal + charHPs[i]) - playerStat.maxHealth;
            }

            charHPs[i] += lifeSteal;
            bossHP -= damage;

            // if boss dies, stop everything here, declare victory
            if (bossHP <= 0) {
                bossAttackStructs.push(new BossAttackStruct(true, i, damage, lifeSteal, critted, dodged, false, true));
                return new BossFightStruct(bossStruct, bossAttackStructs, true);
            }
            else {
                bossAttackStructs.push(new BossAttackStruct(true, i, damage, lifeSteal, critted, dodged, false, false));
            }
        }

        // boss attacks
        const attackedPlayers: number[] = [];
        const count = clamp(getRandomNumber(1, (roomData.difficulty + 1) * 3), 1, 8);

        for (let i: number = 0; i < count; i++) {
            const playerIndex = getRandomNumber(0, playersCount);
            if (charHPs[playerIndex] > 0 && !attackedPlayers.includes(playerIndex)) {
                attackedPlayers.push(playerIndex);
            }
        }

        if (attackedPlayers.length == 0) {
            for (let i: number = 0; i < playersCount; i++) {
                if (charHPs[i] > 0) {
                    attackedPlayers.push(i);
                    break;
                }
            }
        }

        if (attackedPlayers.length == 0) {
            return new BossFightStruct(bossStruct, bossAttackStructs, false);
        }

        for (let i: number = 0; i < attackedPlayers.length; i++) {
            const playerIndex = attackedPlayers[i];
            const playerStat = roomData.playerStatStructs[playerIndex];

            critted = false;
            damage = 0;
            lifeSteal = 0;
            dodged = getRandomFloat(0, 100) < playerStat.dodge;

            if (!dodged) {
                damage = Math.round(getRandomFloat(bossStruct.damage * .5, bossStruct.damage));
                critted = getRandomFloat(0, 100) < bossStruct.critChance;

                if (critted) {
                    damage *= 2;
                }

                damage -= Math.round(damage * getRandomFloat(playerStat.defense * .5, playerStat.defense * .9) / 100);
                lifeSteal = Math.round(damage / 100.0 * bossStruct.lifeSteal);

                if ((lifeSteal + bossHP) >= bossStruct.maxHealth) {
                    lifeSteal -= (lifeSteal + bossHP) - bossStruct.maxHealth;
                }

                bossHP += lifeSteal;
                charHPs[playerIndex] -= damage;
            }

            bossAttackStructs.push(new BossAttackStruct(false, playerIndex, damage, lifeSteal, critted, dodged, charHPs[playerIndex] <= 0, false));
        }
    }

    return new BossFightStruct(bossStruct, bossAttackStructs, false);
}