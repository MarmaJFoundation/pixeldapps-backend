import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from '../../../utils/backend/common/server-config';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: { referrer: string, public_key: string, contract_id: string, fullaccess: boolean, wallet_id: string } = req.body;
    if (!is_valid_request([rq.referrer, rq.public_key, rq.contract_id], res)) {
        return;
    }
    if (rq.fullaccess && !is_valid_request([rq.wallet_id], res)) {
        return;
    }

    // if (rq.fullaccess && !is_valid_request([rq.wallet_id], res)) {
    //   return;
    // }
    const config = getConfig();
    let login_url = config.walletUrl + "/login/?referrer=NEAR-API-PROXY " + rq.referrer + "&public_key=" + rq.public_key + "&contract_id=" + rq.contract_id;
    if (rq.fullaccess) {
        login_url = config.walletUrl + "/login/?referrer=NEAR-API-PROXY " + rq.referrer + "&public_key=" + rq.public_key + "&contract_id=" + rq.wallet_id;
    }

    res.status(200).json(
        {
            url: login_url
        }
    );
}
