import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { OfferUnitRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { get_units_by_ids } from '../../../../utils/backend/chainteamtactics/helper/data_loader';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: OfferUnitRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.unitdata, rq.unitdata?.token_id, rq.unitdata?.price], res)) {
        return;
    }

    try {
        const db = await getChainTeamTacticsDb();
        const unit = (await get_units_by_ids([rq.unitdata.token_id]))[0];

        const response = await changeFunctionWithoutAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ctt_offer_unit",
            { token_id: rq.unitdata.token_id, price: rq.unitdata.price },
            new BN('15000000000000')// 15
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        unit.price = rq.unitdata.price;

        await db.collection("marketplace").replaceOne(
            { token_id: rq.unitdata.token_id },
            { token_id: rq.unitdata.token_id, price: rq.unitdata.price, unit_data: unit },
            { upsert: true }
        );

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "offer-unit");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}