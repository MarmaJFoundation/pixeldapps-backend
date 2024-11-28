import type { NextApiRequest, NextApiResponse } from 'next'
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers, is_trusted_requestor } from '../../../../utils/backend/common/rq_utils';
import { getCurrentWeekCode } from '../../../../utils/backend/common/utils';
import { lockAccount, unlockAccount } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { KickPlayerRequest, LockType } from '../../../../utils/backend/cryptohero/helper/types';
import { createOrUpdateRoom, getRoomByLeader } from '../../../../utils/backend/cryptohero/raid/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: KickPlayerRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey, rq.playerdata, rq.playerdata?.account_id], res)) {
        return;
    }

    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Raid);
        if (!lockTaken) {
            throw "account is locked for Raid";
        }

        const w_code = getCurrentWeekCode();
        const roomData = await getRoomByLeader(rq.account_id, w_code);

        if (!roomData) {
            throw "Room not found";
        }

        const index = roomData.playerNames.indexOf(rq.playerdata.account_id);

        // we must check if index <= 0 because:
        // -1: player are not in group
        //  0: its the leader itself
        if (index <= 0) {
            throw "Player not found";
        }

        const joinedAt = new Date(roomData.playerJoinTimestamps[index]);
        const elapsedHours = Math.round((new Date().getTime() - joinedAt.getTime()) / 3600000);

        if (elapsedHours > 20) {
            throw `Not possible, player joined ${elapsedHours} hours ago`;
        }

        roomData.playerNames.splice(index, 1);
        roomData.playerClasses.splice(index, 1);
        roomData.playerLevels.splice(index, 1);
        roomData.playerRanks.splice(index, 1);
        roomData.playerBossKills.splice(index, 1);
        roomData.playerEquippedItems.splice(index, 1);
        roomData.playerStatStructs.splice(index, 1);
        roomData.playerJoinTimestamps.splice(index, 1);
        roomData.boss_kills = 0;

        await createOrUpdateRoom(roomData);
        res.status(200).json({ success: true, data: roomData });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "kick-player");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Raid);
        }
    }
}