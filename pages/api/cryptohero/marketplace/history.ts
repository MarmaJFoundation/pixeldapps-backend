import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
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
        const max_results = 20;
        const db = await getCryptoHeroDb();

        const seller_results = await db.collection("market_history")
            .find({ seller: rq.account_id })
            .project({ _id: 0 })
            .sort({ _id: -1 })
            .limit(max_results)
            .toArray();

        const buyer_results = await db.collection("market_history")
            .find({ buyer: rq.account_id })
            .project({ _id: 0 })
            .sort({ _id: -1 })
            .limit(max_results)
            .toArray();

        res.status(200).json({ success: true, data: { seller: seller_results, buyer: buyer_results } });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "history");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}