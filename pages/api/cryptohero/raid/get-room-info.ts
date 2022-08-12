import type { NextApiRequest, NextApiResponse } from 'next'
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../../utils/backend/common/types';
import { getRoom } from '../../../../utils/backend/cryptohero/raid/utils';

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
        const roomData = await getRoom(rq.account_id);
        res.status(200).json({ success: true, data: roomData });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "get-room-info");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}