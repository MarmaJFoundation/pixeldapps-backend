import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../../utils/backend/common/blockchain';
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_account_banned, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCurrentWeekCode, is_testnet_env } from '../../../../utils/backend/common/utils';
import { getPlayerData, lockAccount, unlockAccount } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { LockType, StartRoomRequest } from '../../../../utils/backend/cryptohero/helper/types';
import { CharMaxLevel, generateCharacterInfo, GetCharacterRank, GetExpForNextLevel, GetExpGainBasedOnDifficulty, GetRestingTimerBasedOnDifficulty, GetStatRank } from '../../../../utils/backend/cryptohero/helper/utils';
import { GenerateFightStruct } from '../../../../utils/backend/cryptohero/raid/core';
import { checkInsertUsedItems, createOrUpdateRoom, getRoom, RaidPlayersCount } from '../../../../utils/backend/cryptohero/raid/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: StartRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.playerdata, rq.playerdata?.class_type, rq.playerdata?.inventory], res)) {
        return;
    }

    if (await is_account_banned(rq.account_id, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Raid);
        if (!lockTaken) {
            throw "account is locked for Raid";
        }

        const w_code = getCurrentWeekCode();
        const roomData = await getRoom(rq.account_id, w_code);

        if (!roomData) {
            throw "Room not found";
        }

        if (!is_testnet_env() && roomData.playerNames.length < RaidPlayersCount) {
            throw "Room is not full";
        }

        const playerData = await getPlayerData(rq, true);
        const characterData = playerData.player_character;
        const characterInfo = await generateCharacterInfo(playerData);
        const statRank = GetStatRank(characterInfo);
        const characterRank = GetCharacterRank(statRank, characterData.level);
        const index = roomData.playerNames.indexOf(rq.account_id);
        const usedItems = playerData.player_inventory.map(x => x.token_id);

        const itemAlreadyUsed = await checkInsertUsedItems(rq.account_id, usedItems, w_code);
        if (itemAlreadyUsed) {
            throw "Equipped item already used by another player this week: " + itemAlreadyUsed;
        }

        // update player's info
        roomData.playerClasses[index] = characterData.class_type;
        roomData.playerLevels[index] = characterData.level;
        roomData.playerRanks[index] = characterRank;
        roomData.playerEquippedItems[index] = playerData.player_inventory.map(x => x.item_type);
        roomData.playerStatStructs[index] = characterInfo;

        const raidInfo = GenerateFightStruct(roomData);


        const restingTimer = GetRestingTimerBasedOnDifficulty(roomData.difficulty, characterData.potions);
        const expGain = GetExpGainBasedOnDifficulty(roomData.difficulty, raidInfo.victory);
        let lvlUp = false;

        if (characterData.level < CharMaxLevel) {
            characterData.experience += expGain;
            lvlUp = characterData.experience >= GetExpForNextLevel(characterData.level);

            if (lvlUp) {
                do {
                    characterData.level++;
                } while (characterData.experience >= GetExpForNextLevel(characterData.level));
            }
        }

        const contract_args = {
            account_id: rq.account_id,
            character_results: {
                class_type: characterData.class_type,
                exp_gain: expGain,
                level_up: lvlUp,
                resting_timer: restingTimer.toString(),
            },
            difficulty: roomData.difficulty,
            victory: raidInfo.victory,
            leader_id: roomData.account_id,
            week_code: roomData.week_code,
        };


        // mongodb's code
        const response = await changeFunctionWithoutAttachment(
            MANAGER_ACCOUNT,
            MANAGER_KEY,
            APP_CONTRACT,
            "ch_save_raid_result_tmp",
            { result: contract_args },
            new BN('15000000000000')// 15
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        if (raidInfo.victory) {
            roomData.playerBossKills[index]++;
            roomData.boss_kills++;
        }
        roomData.last_fight = Date.now();

        await createOrUpdateRoom(roomData);
        res.status(200).json({ success: true, data: raidInfo });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "simulate-fight");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Raid);
        }
    }
}