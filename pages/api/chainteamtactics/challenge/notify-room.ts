import type { NextApiRequest, NextApiResponse } from 'next'
import { lockAccount, unlockAccount } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { LockType, NotifyRoomRequest, RoomNotificationType } from '../../../../utils/backend/chainteamtactics/helper/types';
import { createOrUpdateRoomNotification, deleteRoomAndFinishFight, getRoomByLeader, getRoomNotification } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { assert } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: NotifyRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey], res)) {
        return;
    }

    // ensure the notified player itself is behind this
    // otherwise its opponent could fake a request
    // refusing next round to force its win
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Battle);
        assert(lockTaken, "account is locked for Battle");

        const roomNotification = await getRoomNotification(rq.account_id);

        assert(roomNotification, "notification not found");
        assert(roomNotification.notify_type == RoomNotificationType.RoundFinish, "only notifications of type RoundFinish are allowed to being refused");

        const roomData = await getRoomByLeader(roomNotification.room_id);

        assert(roomData, "room not found");

        const fightLoserIndex = roomData.playerNames.indexOf(rq.account_id);
        const fightWinnerIndex = fightLoserIndex == 1 ? 0 : 1;

        if (!await deleteRoomAndFinishFight(roomData, fightWinnerIndex, fightLoserIndex, false, res)) {
            return;
        }

        await createOrUpdateRoomNotification(RoomNotificationType.FightFinish, roomData);
        res.status(200).json({ success: true });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "notify-room");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Battle);
        }
    }
}