import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, isAccessKeyValid, viewFunction } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: { account_id: string, publickey: string } = req.body;
    if (!is_valid_request([rq.account_id, rq.publickey], res)) {
        return;
    }
    try {
        const keyState = await isAccessKeyValid(rq.account_id, rq.publickey);
        const player_registered = await viewFunction(APP_CONTRACT, "is_player_registered", { account_id: rq.account_id });
        res.status(200).json({ success: true, data: { valid: keyState.valid, allowance: keyState.allowance, fullAccess: keyState.fullAccess, player_registered: player_registered } });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "is_valid_login/is_player_registered");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}
