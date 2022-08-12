import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { changeFunctionWithoutAttachment, APP_CONTRACT, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { CancelOfferItemRequest } from '../../../../utils/backend/cryptohero/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: CancelOfferItemRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.itemdata, rq.itemdata?.token_id], res)) {
        return;
    }

    try {
        const db = await getCryptoHeroDb();

        const response = await changeFunctionWithoutAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ch_cancel_offer_item",
            { token_id: rq.itemdata.token_id },
            new BN('15000000000000')// 15
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await db.collection("marketplace").deleteOne({ token_id: rq.itemdata.token_id });

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "cancel-offer-item");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}