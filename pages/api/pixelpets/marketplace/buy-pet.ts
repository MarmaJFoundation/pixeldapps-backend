import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { APP_CONTRACT, changeFunctionWithAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { CancelOfferPetRequest } from '../../../../utils/backend/pixelpets/helper/types';

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
        const pet_info = await db.collection("marketplace").findOne({ token_id: rq.token_id });
        if (pet_info && pet_info.pet_data.owner == rq.account_id) {
            throw 'You can\'t buy your own pet'
        }
        const response = await changeFunctionWithAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "marketplace_buy", { token_id: rq.token_id, owner: pet_info.pet_data.owner, buyer: rq.account_id, price: pet_info.price }, new BN('1'), "https://ecosystem.pixeldapps.co/callback?page=pet_bought", new BN('150000000000000'));
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        await db.collection("marketplace").deleteOne({ token_id: rq.token_id });
        await db.collection("marketplace_check").insertOne({ token_id: rq.token_id, buyer: rq.account_id, owner: pet_info.pet_data.owner, price: pet_info.price });

        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "marketplace_buy");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}


