import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPlayerData, getPlayerWithPosition, lockAccount, unlockAccount } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { JoinRoomRequest, EndCreateRoomRequest, LockType, RoomNotificationType } from '../../../../utils/backend/chainteamtactics/helper/types';
import { createOrUpdateRoom, createOrUpdateRoomNotification, getAllJoinedRooms, getRoomByLeader, MaxJoinedRooms } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../../utils/backend/common/blockchain';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { assert } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: JoinRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey, rq.leader_id], res)) {
        return;
    }

    // do not allow a player to attempt to join a room with another players name
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Battle);
        assert(lockTaken, "account is locked for Battle");

        const roomData = await getRoomByLeader(rq.leader_id);

        assert(roomData, "room not found");
        assert(roomData.playerNames.length == 1, roomData.playerNames.length == 0 ? "room is not ready" : "room is closed");
        assert(roomData.account_id != rq.account_id, "you can't join your own room");

        // a player can lead up to 1 room and join up to 5... total of 6
        const allJoinedRooms = await getAllJoinedRooms(rq.account_id);

        assert(allJoinedRooms.length < MaxJoinedRooms, `you can join up to ${MaxJoinedRooms} rooms`);

        const urq = rq as unknown as EndCreateRoomRequest;
        urq.player_loadout = [];

        const playerdata = await getPlayerData(urq, roomData.mapIndex, true, false, true);
        
        //#TODO enable after beta
        // const response = await changeFunctionWithoutAttachment(
        //     MANAGER_ACCOUNT,
        //     MANAGER_KEY,
        //     APP_CONTRACT,
        //     "ctt_create_or_join_fight",
        //     {
        //         account_id: rq.account_id,
        //         bet_type: roomData.betType,
        //     },
        //     new BN('15000000000000')// 15
        // );

        // if (!checkFunctionResponse(response)) {
        //     return res.status(200).json({ success: false, error: response.error.type });
        // }

        roomData.playerNames.push(rq.account_id);
        roomData.playerRanks.push(playerdata.rating);
        roomData.playerRoundWins.push(0);
        roomData.last_activity = Date.now();

        const roomInfo = {
            mapIndex: roomData.mapIndex,
            loadout: roomData.playerLoadouts[0].map(x => x),
        };

        await createOrUpdateRoom(roomData);
        await createOrUpdateRoomNotification(RoomNotificationType.PendingJoin, roomData);
        res.status(200).json({ success: true, data: roomInfo });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "join-room");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Battle);
        }
    }
}