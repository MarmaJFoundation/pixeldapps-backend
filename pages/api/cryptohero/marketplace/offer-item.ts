import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { get_items_by_ids } from '../../../../utils/backend/cryptohero/helper/data_loader';
import { OfferItemRequest } from '../../../../utils/backend/cryptohero/helper/types';
import { getItemBaseData } from '../../../../utils/backend/cryptohero/helper/basic_game';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: OfferItemRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.itemdata, rq.itemdata?.token_id, rq.itemdata?.price], res)) {
        return;
    }

    try {
        const db = await getCryptoHeroDb();
        const item = (await get_items_by_ids([rq.itemdata.token_id]))[0];
        const itemBaseData = await getItemBaseData();
        const itemInfo = itemBaseData.find(x => x.item_type == item.item_type);

        const response = await changeFunctionWithoutAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ch_offer_item",
            { token_id: rq.itemdata.token_id, price: rq.itemdata.price },
            new BN('15000000000000')// 15
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        item["class_type"] = itemInfo.class_type;
        item["equip_type"] = itemInfo.equip_type;
        item.price = rq.itemdata.price;

        await db.collection("marketplace").replaceOne(
            { token_id: rq.itemdata.token_id },
            { token_id: rq.itemdata.token_id, price: rq.itemdata.price, item_data: item, created_at: new Date() },
            { upsert: true }
        );

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "offer-item");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}