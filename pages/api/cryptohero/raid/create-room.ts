import type { NextApiRequest, NextApiResponse } from 'next'
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCurrentWeekCode } from '../../../../utils/backend/common/utils';
import { getPlayerData, lockAccount, unlockAccount } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { CreateRoomRequest, LockType } from '../../../../utils/backend/cryptohero/helper/types';
import { assert_difficulty, generateCharacterInfo, GetCharacterRank, GetStatRank } from '../../../../utils/backend/cryptohero/helper/utils';
import { RoomData } from '../../../../utils/backend/cryptohero/raid/types';
import { checkInsertUsedItems, createOrUpdateRoom, getRoom } from '../../../../utils/backend/cryptohero/raid/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: CreateRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.playerdata, rq.playerdata?.class_type, rq.playerdata?.inventory], res)) {
        return;
    }

    if (!is_defined_request([rq.playerdata.difficulty], res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        assert_difficulty(rq.playerdata.difficulty);

        lockTaken = await lockAccount(rq.account_id, LockType.Raid);
        if (!lockTaken) {
            throw "account is locked for Raid";
        }

        const w_code = getCurrentWeekCode();
        let roomData = await getRoom(rq.account_id, w_code);

        if (roomData) {
            throw "Already in a room";
        }

        const playerData = await getPlayerData(rq, true);
        const characterData = playerData.player_character;
        const characterInfo = await generateCharacterInfo(playerData);
        const statRank = GetStatRank(characterInfo);
        const characterRank = GetCharacterRank(statRank, characterData.level);

        const usedItems = playerData.player_inventory.map(x => x.token_id);

        const itemAlreadyUsed = await checkInsertUsedItems(rq.account_id, usedItems, w_code);
        if (itemAlreadyUsed) {
            throw "Equipped item already used by another player this week: " + itemAlreadyUsed;
        }

        // mongodb's code but without 'raid_groups' collection
        roomData = new RoomData(
            rq.account_id,
            w_code,
            rq.playerdata.difficulty,
            [playerData.account_id],
            [characterData.class_type],
            [characterData.level],
            [characterRank],
            [0],
            [playerData.player_inventory.map(x => x.item_type)],
            [characterInfo],
            [Date.now()]
        );

        // -----------------------------------------------------------------------------

        await createOrUpdateRoom(roomData);
        res.status(200).json({ success: true, data: roomData });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "create-room");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Raid);
        }
    }
}