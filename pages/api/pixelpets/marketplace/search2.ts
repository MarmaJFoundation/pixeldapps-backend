import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: { account_id: string, search_type: string } = req.body;
    if (!is_valid_request([rq.account_id], res)) {
        return;
    }
    try {
        const db = await getPixelPetsDb();
        const entries = await db.collection("marketplace").find({
            // "pet_data.owner": { $ne: rq.account_id, },
            "pet_data.power_level": { $gt: 77 }
        })
        .project({
            _id: 0,
            pet_data: {
                token_id: 0,
                xp: 0,
                // owner: 0,
                price: 0,
                state: 0,
                state_timer: 0,
                combat_info: 0,
            }
        })
        .sort({ "pet_data.rarity": -1, "pet_data.power_level": -1 })
        .limit(100)
        .toArray();

        res.status(200).json({ success: true, data: entries });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "search");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}


