import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { APP_CONTRACT, changeFunctionWithAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { BuyItemRequest, ItemToken } from '../../../../utils/backend/cryptohero/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: BuyItemRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.itemdata, rq.itemdata?.token_id], res)) {
        return;
    }

    try {
        const db = await getCryptoHeroDb();
        const entry = await db.collection("marketplace").findOne({ token_id: rq.itemdata.token_id });
        const item_token = entry.item_data as ItemToken;

        if (entry && item_token.owner == rq.account_id) {
            throw "You can't buy your own item";
        }

        const response = await changeFunctionWithAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ch_buy_item",
            { token_id: rq.itemdata.token_id, owner: item_token.owner, buyer: rq.account_id, price: entry.price },
            new BN('1'),
            "https://pd.marmaj.org/callback?page=item_bought",
            new BN('150000000000000')// 150???
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await db.collection("marketplace").deleteOne({ token_id: rq.itemdata.token_id });

        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "buy-item");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}