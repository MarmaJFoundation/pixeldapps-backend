import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { changeFunctionWithoutAttachment, APP_CONTRACT, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { CancelOfferPetRequest } from '../../../../utils/backend/pixelpets/helper/types';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: CancelOfferPetRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey, rq.token_id], res)) {
        return;
    }
    try {
        const db = await getPixelPetsDb();
        const response = await changeFunctionWithoutAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "cancel_offer_pet", { token_id: rq.token_id }, new BN('12000000000000'));
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        const marketplace = await db.collection("marketplace").deleteOne({ token_id: rq.token_id });

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "cancel_offer_pet");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}
