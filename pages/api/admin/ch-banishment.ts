import type { NextApiRequest, NextApiResponse } from 'next'
import { logCryptoHeroErrorDb } from '../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { BanishmentRequest } from '../../../utils/backend/common/types';
import { _onlyPxDapps } from '../../../utils/backend/common/blockchain';
import { banAccount, getDbBannedAccounts, unbanAccount } from '../../../utils/backend/cryptohero/helper/basic_game';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: BanishmentRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.password, rq.user_id], res)) {
        return;
    }

    if (!is_defined_request([rq.reason, rq.temporary, rq.unban, rq.readonly], res)) {
        return;
    }

    try {
        _onlyPxDapps(rq.account_id, rq.password);

        if (!rq.readonly) {
            if (!rq.unban) {
                await banAccount(rq.user_id, rq.temporary, rq.reason);
            } else {
                await unbanAccount(rq.user_id);
            }

            res.status(200).json({ success: true });
        } else {
            const accounts = await getDbBannedAccounts();
            res.status(200).json({ success: true, data: accounts });
        }
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "ch-banishment");
        res.status(200).json({ success: false });
    }
}