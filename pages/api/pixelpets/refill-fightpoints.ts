import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { changeFunctionWithAttachment, APP_CONTRACT, checkFunctionResponse } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { CancelOfferPetRequest } from '../../../utils/backend/pixelpets/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: CancelOfferPetRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey], res)) {
        return;
    }
    try {
        const response = await changeFunctionWithAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "refill_fight_balance", {}, new BN('250000000000000000000000'), "https://pd.marmaj.org/callback?page=refill", new BN('40000000000000'));
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "refill_fight_balance");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}


