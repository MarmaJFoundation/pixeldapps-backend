import type { NextApiRequest, NextApiResponse } from 'next'
import { GetAllRoomsRequest, RoomData } from '../../../../utils/backend/chainteamtactics/helper/types';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: GetAllRoomsRequest = req.body;

    if (!is_valid_request([rq.account_id], res)) {
        return;
    }

    try {

        const db = await getChainTeamTacticsDb();
        const roomData = await db.collection("rooms").find<RoomData>(
            { playerNames: { $elemMatch: { $eq: rq.account_id } } },
            { projection: { _id: 0, playerLoadouts: 0, prev_round_loser: 0, prev_round_winner: 0, prev_round_id: 0 } }
        ).toArray();
        res.status(200).json({ success: true, data: roomData });

    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "get-my-rooms");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}