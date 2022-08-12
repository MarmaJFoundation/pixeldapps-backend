import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { lockAccount, unlockAccount } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { BeginCreateRoomRequest, LockType, RoomBetTierTypes, RoomData, RoomNotificationType } from '../../../../utils/backend/chainteamtactics/helper/types';
import { createOrUpdateRoom, createOrUpdateRoomNotification, getRoomByLeader, get_random_map } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../../utils/backend/common/blockchain';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { assert } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: BeginCreateRoomRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey], res)) {
        return;
    }

    if (!is_defined_request([rq.bet_type], res)) {
        return;
    }

    // do not allow a player to attempt to create a room with another players name
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        assert(rq.bet_type >= RoomBetTierTypes.Tier1 && rq.bet_type <= RoomBetTierTypes.Tier3, "invalid bet type");

        lockTaken = await lockAccount(rq.account_id, LockType.Battle);
        assert(lockTaken, "account is locked for Battle");

        let roomData = await getRoomByLeader(rq.account_id);

        assert(!roomData, "already leading a room");

        //#TODO enable after beta
        // const response = await changeFunctionWithoutAttachment(
        //     MANAGER_ACCOUNT,
        //     MANAGER_KEY,
        //     APP_CONTRACT,
        //     "ctt_create_or_join_fight",
        //     {
        //         account_id: rq.account_id,
        //         bet_type: rq.bet_type,
        //     },
        //     new BN('15000000000000')// 15
        // );

        // if (!checkFunctionResponse(response)) {
        //     return res.status(200).json({ success: false, error: response.error.type });
        // }

        roomData = new RoomData(
            rq.account_id,
            get_random_map(),
            rq.bet_type
        );

        await createOrUpdateRoom(roomData);
        await createOrUpdateRoomNotification(RoomNotificationType.PendingCreate, roomData);
        res.status(200).json({ success: true, data: roomData.mapIndex });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "begin-create-room");
        res.status(200).json({ success: false, error: err });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Battle);
        }
    }
}