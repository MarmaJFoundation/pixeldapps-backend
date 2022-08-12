import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { EditItemRequest } from '../../../../utils/backend/cryptohero/helper/types';
import { _onlyPxDapps } from '../../../../utils/backend/common/blockchain';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: EditItemRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.password, rq.itemdata], res)) {
        return;
    }

    try {
        _onlyPxDapps(rq.account_id, rq.password);
        
        const db = await getCryptoHeroDb();
        const options = { upsert: true };

        await db.collection("items").replaceOne(
            { item_type: rq.itemdata.item_type },
            rq.itemdata,
            options
        );

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "edit-item");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }
}