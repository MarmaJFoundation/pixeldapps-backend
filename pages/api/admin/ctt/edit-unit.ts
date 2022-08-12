import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { EditUnitRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, _onlyPxDapps } from '../../../../utils/backend/common/blockchain';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: EditUnitRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.password, rq.unitdata], res)) {
        return;
    }

    try {
        _onlyPxDapps(rq.account_id, rq.password);

        const db = await getChainTeamTacticsDb();
        const options = { upsert: true };

        const response = await changeFunctionWithoutAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ctt_insert_update_unit",
            {
                unitdata: {
                    unit_type: rq.unitdata.unit_type,
                    tier_type: rq.unitdata.unit_tier,
                    health: rq.unitdata.health,
                    damage: rq.unitdata.damage,
                    speed: rq.unitdata.speed,
                }
            }
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await db.collection("units").replaceOne(
            { unit_type: rq.unitdata.unit_type },
            rq.unitdata,
            options
        );

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "edit-unit");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }
}