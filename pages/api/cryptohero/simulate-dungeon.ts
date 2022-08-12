import BN from "bn.js";
import { NextApiRequest, NextApiResponse } from "next";
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from "../../../utils/backend/common/blockchain";
import { logCryptoHeroDungeonDb, logCryptoHeroErrorDb } from "../../../utils/backend/common/mongo-helper";
import { is_account_banned, is_defined_request, is_valid_request, setup_headers } from "../../../utils/backend/common/rq_utils";
import { GenerateFightStruct } from "../../../utils/backend/cryptohero/dungeon/core";
import { getPlayerData, lockAccount, unlockAccount, updateLeaderboard } from "../../../utils/backend/cryptohero/helper/basic_game";
import { DungeonRequest, LockType } from "../../../utils/backend/cryptohero/helper/types";
import { assert_difficulty, CharMaxLevel, generateCharacterInfo, GetCharacterRank, GetExpForNextLevel, GetExpGainBasedOnDifficulty, GetRestingTimerBasedOnDifficulty, GetStatRank } from "../../../utils/backend/cryptohero/helper/utils";

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: DungeonRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.playerdata, rq.playerdata?.class_type, rq.playerdata?.inventory], res)) {
        return;
    }

    if (!is_defined_request([rq.playerdata.difficulty], res)) {
        return;
    }

    if (await is_account_banned(rq.account_id, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        assert_difficulty(rq.playerdata.difficulty);

        lockTaken = await lockAccount(rq.account_id, LockType.Dungeon);
        if (!lockTaken) {
            throw "account is locked for Dungeon";
        }

        const playerData = await getPlayerData(rq);
        const characterData = playerData.player_character;
        const characterInfo = await generateCharacterInfo(playerData);

        const dungeonInfo = GenerateFightStruct(rq.playerdata.difficulty, characterInfo, characterData.potions);
        const statRank = GetStatRank(characterInfo);

        // console.log("dungeonFightStruct: " + JSON.stringify(dungeonInfo, null, 4));

        const restingTimer = GetRestingTimerBasedOnDifficulty(rq.playerdata.difficulty, characterData.potions);
        const expGain = GetExpGainBasedOnDifficulty(rq.playerdata.difficulty, dungeonInfo.victory);
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

        const characterRank = GetCharacterRank(statRank, characterData.level);

        const contract_args = {
            account_id: rq.account_id,
            character_results: {
                class_type: characterData.class_type,
                exp_gain: expGain,
                level_up: lvlUp,
                resting_timer: restingTimer.toString(),
            },
            dungeon_results: {
                difficulty: rq.playerdata.difficulty,
                victory: dungeonInfo.victory,
                item_drop: dungeonInfo.victory ? dungeonInfo.itemDrop : undefined,
            }
        };

        const response = await changeFunctionWithoutAttachment(
            MANAGER_ACCOUNT,
            MANAGER_KEY,
            APP_CONTRACT,
            "ch_save_dungeon_result",
            { result: contract_args },
            new BN('20000000000000')// 20
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        if (dungeonInfo.victory) {
            dungeonInfo.itemDrop["token_id"] = response.data;
        }

        await updateLeaderboard(characterRank, playerData);
        await logCryptoHeroDungeonDb(rq.account_id);
        res.status(200).json({ success: true, data: dungeonInfo });
    }
    catch (err) {
        console.log(err);
        await logCryptoHeroErrorDb(err, rq.account_id, "simulate-dungeon");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Dungeon);
        }
    }
}