import type { NextApiRequest, NextApiResponse } from 'next'
import { STARTER_PET_IDS } from '../../../../utils/backend/pixelpets/helper/basic_game';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;
    if (!is_valid_request([rq.account_id], res)) {
        return;
    }

    try {
        const db = await getPixelPetsDb();
        const results = await db.collection("marketplace").distinct("pet_data.pet_type", {
            // "pet_data.owner": {// filter all pets from the requesting player
            //     $ne: rq.account_id,
            // }
        })
        .then(x => x.filter(pet_id => !STARTER_PET_IDS.includes(pet_id)));

        res.status(200).json({ success: true, data: results });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "get_available_pets");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}

