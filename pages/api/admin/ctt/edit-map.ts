import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { EditMapRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { _onlyPxDapps } from '../../../../utils/backend/common/blockchain';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: EditMapRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.password, rq.mapdata], res)) {
        return;
    }

    try {
        _onlyPxDapps(rq.account_id, rq.password);
        
        const db = await getChainTeamTacticsDb();
        const options = { upsert: true };

        await db.collection("maps").replaceOne(
            { map_type: rq.mapdata.map_type },
            rq.mapdata,
            options
        );

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "edit-map");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }
}