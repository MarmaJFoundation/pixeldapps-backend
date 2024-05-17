import type { NextApiRequest, NextApiResponse } from 'next'
import { FightRequest, LockType } from '../../../utils/backend/pixelpets/helper/types';
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../utils/backend/common/blockchain';

import {
    checkDecreaseRating,
    getEnemyTeam_v5,
    getPlayerTeam,
    lockAccount,
    unlockAccount,
    updateLeaderboard
} from '../../../utils/backend/pixelpets/helper/basic_game'

import {
    generateBattleInfo,
    getPreviousPlayerData,
    updatePlayersAfterBattle,
    updatePlayersCardStats,
} from '../../../utils/backend/pixelpets/fight/core'

import {
    is_valid_request, setup_headers
} from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: FightRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.playerdata, rq.playerdata?.pet_loadout], res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Fight);
        if (!lockTaken) {
            throw "account is locked for Fight";
        }

        if (!await checkDecreaseRating(rq.account_id, null, res)) {
            return;
        }

        const playerData = await getPlayerTeam(rq);
        const enemyData = await getEnemyTeam_v5(playerData);

        // console.log(
        //     playerData.account_id + "(" + playerData.player_rating.toString() + ")" +
        //     " vs " +
        //     enemyData.account_id + "(" + enemyData.player_rating.toString() + ")"
        // );

        const battleInfo = generateBattleInfo(playerData, enemyData);
        const playerWon = battleInfo.winnerAccountName == playerData.account_id;
        const prevPlayerData = getPreviousPlayerData(playerData, battleInfo.playerInfo1);

        if (playerWon) {
            battleInfo.expGain = updatePlayersAfterBattle(playerData, enemyData, true);
        } else {
            battleInfo.expGain = updatePlayersAfterBattle(enemyData, playerData, false);
        }

        battleInfo.rankChange = playerData.player_rating - prevPlayerData.rating;

        // console.log(
        //     "Previous rating: " + prevPlayerData.rating.toString() + 
        //     ", current: " + playerData.player_rating.toString() +
        //     " > " + battleInfo.rankChange.toString());

        // console.log("prevPlayerData: " + JSON.stringify(prevPlayerData));

        let i = 0;
        const petResultsInfo = prevPlayerData.pets.map(x => {
            const j = i++;
            const dead = battleInfo.player1CardStats[j].health <= 0;
            const lvlUp = playerData.player_loadout[j].pet_level > x.level;
            const xpGain = playerData.player_loadout[j].pet_experience - x.exp;
            if (lvlUp) {
                playerData.player_loadout[j].pet_experience = 0;
            }
            return {
                token_id: playerData.player_loadout[j].token_id,
                injured: dead,
                xp_gain: xpGain,
                level_up: lvlUp,
            }
        });

        // this function only reset cards health
        // do not call this before 'petResultsInfo'
        updatePlayersCardStats(battleInfo);

        // // console.log("BattleInfo: " + JSON.stringify(battleInfo));
        // console.log("PetResults: " + JSON.stringify(petResultsInfo));
        // console.log("Winner: " + battleInfo.winnerAccountName);

        const contract_args = {
            account_id: rq.account_id,
            pet_results: petResultsInfo,
            rating_change: battleInfo.rankChange,
            won: playerWon,
        };

        // console.log("Contract args: " + JSON.stringify(contract_args));

        const response = await changeFunctionWithoutAttachment(
            MANAGER_ACCOUNT,
            MANAGER_KEY,
            APP_CONTRACT,
            "save_fight_result",
            { result: contract_args });

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await updateLeaderboard(playerData, playerWon);

        // console.log(response);

        res.status(200).json({ success: true, data: battleInfo });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "simulate-fight");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Fight);
        }
    }
}

// near view pixeltoken.testnet get_player_data "{ \"account_id\": \"bubruno.testnet\" }"
// near view pixeltoken.testnet get_pets_by_ids "{ \"pet_ids\": [ \"100\", \"101\", \"102\" ] }"