import type { NextApiRequest, NextApiResponse } from 'next'
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { ExceptionRequest } from '../../../utils/backend/common/types';
import { _onlyPxDapps } from '../../../utils/backend/common/blockchain';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: ExceptionRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.password], res)) {
        return;
    }

    if (!is_defined_request([rq.limit, rq.countonly], res)) {
        return;
    }

    try {
        _onlyPxDapps(rq.account_id, rq.password);

        const db = await getCryptoHeroDb();

        if (!rq.countonly) {
            const filter = {};

            if (rq.user_id) {
                filter["user"] = rq.user_id;
            }

            if (rq.method_name) {
                filter["method"] = rq.method_name;
            }

            if (rq.error_descr) {
                filter["error"] = rq.error_descr;
            }

            const errors = (await db.collection("err")
                .find(filter, { projection: { _id: 0 } })
                .sort({ created_at: -1 })
                .limit(rq.limit)
                .toArray())
                .reverse();

            return res.status(200).json({ success: true, data: errors });
        }
        else {
            const result = await db.collection("err").aggregate([
                {
                    '$match': {
                        'created_at': {
                            '$gte': new Date(new Date().getTime() - 86400000)
                        }
                    }
                },
                {
                    '$group': {
                        '_id': '$user',
                        'count': {
                            '$sum': 1
                        }
                    }
                },
                {
                    '$sort': {
                        'count': -1
                    }
                }
            ])
            .toArray()

            return res.status(200).json({ success: true, data: result });
        }
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "ch-errors");
        res.status(200).json({ success: false });
    }
}