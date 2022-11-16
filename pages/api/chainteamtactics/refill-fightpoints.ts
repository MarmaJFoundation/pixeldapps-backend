import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { changeFunctionWithAttachment, APP_CONTRACT, checkFunctionResponse } from '../../../utils/backend/common/blockchain';
import { logChainTeamTacticsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: FunctionRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey], res)) {
        return;
    }

    try {
        const response = await changeFunctionWithAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ctt_refill_fight_balance",
            {},
            new BN('200000000000000000000000'),
            "https://pd.marmaj.org/callback?page=refill_ctt",
            new BN('40000000000000')// 40
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "refill-fightpoints");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}