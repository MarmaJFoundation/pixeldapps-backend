import type { NextApiRequest, NextApiResponse } from 'next'
import { viewFunction } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: FunctionRequest = Object.assign({}, req.body);

    if (!is_valid_request([rq.contract_id, rq.method_name/*, rq.args*/], res)) {
        return;
    }

    if (Object.keys(rq.args).length) {
        rq.args = JSON.parse(rq.args);
    }
    else {
        rq.args = {};
    }
    try {
        const response = await viewFunction(rq.contract_id, rq.method_name, rq.args);
        res.status(200).json({ success: true, data: response });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "viewFunction");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }
}
