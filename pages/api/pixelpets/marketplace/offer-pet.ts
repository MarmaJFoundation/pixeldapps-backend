import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { scaled_pets_by_ids } from '../../../../utils/backend/pixelpets/helper/pet_scaling';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { OfferPetRequest } from '../../../../utils/backend/pixelpets/helper/types';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: OfferPetRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey, rq.token_id, rq.price], res)) {
        return;
    }
    try {
        const db = await getPixelPetsDb();
        const pet = await scaled_pets_by_ids([rq.token_id]);

        pet[0].price = rq.price;
        pet[0].state = 2;

        const response = await changeFunctionWithoutAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "offer_pet", { token_id: rq.token_id, price: rq.price }, new BN('17000000000000'));
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        const options = { upsert: true };
        const marketplace = await db.collection("marketplace").replaceOne({ token_id: rq.token_id }, { token_id: rq.token_id, price: rq.price, pet_data: pet[0] }, options);

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "offer_pet");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}
