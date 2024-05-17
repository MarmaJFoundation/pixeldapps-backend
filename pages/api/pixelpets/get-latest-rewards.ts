import type { NextApiRequest, NextApiResponse } from 'next'
import { setup_headers } from '../../../utils/backend/common/rq_utils';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const db = await getPixelPetsDb();

    try {
        const latest_rewards = await db.collection("distributed_rewards").find({}).sort({ "created_at": -1 }).limit(4).toArray();
        res.status(200).json({ success: true, data: latest_rewards });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, "view", "get-latest-rewards");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}
