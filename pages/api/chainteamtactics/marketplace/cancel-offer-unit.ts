import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { CancelOfferUnitRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { changeFunctionWithoutAttachment, APP_CONTRACT, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: CancelOfferUnitRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.unitdata, rq.unitdata?.token_id], res)) {
        return;
    }

    try {
        const db = await getChainTeamTacticsDb();
        const response = await changeFunctionWithoutAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ctt_cancel_offer_unit",
            { token_id: rq.unitdata.token_id },
            new BN('15000000000000')// 15
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await db.collection("marketplace").deleteOne({ token_id: rq.unitdata.token_id });
        res.status(200).json({ success: true });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "cancel-offer-unit");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}