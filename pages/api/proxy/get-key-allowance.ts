import type { NextApiRequest, NextApiResponse } from 'next'
import { isAccessKeyValid } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: { account_id: string, publickey: string } = req.body;
    if (!is_valid_request([rq.account_id, rq.publickey], res)) {
        return;
    }
    const keyState = await isAccessKeyValid(rq.account_id, rq.publickey);
    res.status(200).json({ success: true, data: { valid: keyState.valid, allowance: keyState.allowance, fullAccess: keyState.fullAccess } });
}
