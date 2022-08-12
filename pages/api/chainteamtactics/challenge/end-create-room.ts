import type { NextApiRequest, NextApiResponse } from 'next'
import { getPlayerData, getPlayerWithPosition, lockAccount, unlockAccount } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { EndCreateRoomRequest, LockType, RoomNotificationType } from '../../../../utils/backend/chainteamtactics/helper/types';
import { createOrUpdateRoom, deleteNotification, getRoomByLeader } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { assert } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: EndCreateRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey, rq.player_loadout], res)) {
        return;
    }

    // should be almost impossible to someone fake a request finishing
    // someone's else room creation with all correct tokens and coordinates
    // but who knows... its better ensure its the room creator itself
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Battle);
        assert(lockTaken, "account is locked for Battle");

        const roomData = await getRoomByLeader(rq.account_id);
        console.log(roomData);
        assert(roomData, "room not found");
        assert(roomData.playerNames.length == 0, "room is already fully created");

        const playerdata = await getPlayerData(rq, roomData.mapIndex, false);

        roomData.playerNames.push(rq.account_id);
        roomData.playerRanks.push(playerdata.rating);
        roomData.playerRoundWins.push(0);
        roomData.playerFightWins.push(playerdata.matches_won);
        roomData.playerFightWins.push(playerdata.matches_lost);
        roomData.playerLoadouts.push(playerdata.player_loadout);

        await createOrUpdateRoom(roomData);
        await deleteNotification(RoomNotificationType.PendingCreate, roomData);
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        await logChainTeamTacticsErrorDb(err, rq.account_id, "end-create-room");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Battle);
        }
    }
}