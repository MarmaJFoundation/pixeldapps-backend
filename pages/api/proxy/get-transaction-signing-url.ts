import BN from 'bn.js';
import { DEFAULT_FUNCTION_CALL_GAS, utils } from 'near-api-js';
import { functionCall } from 'near-api-js/lib/transaction';
import { TransactionManager } from "near-transaction-manager";
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAccount, getSigningTransactionsWalletUrl } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { WalletRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: WalletRequest = req.body;
    is_valid_request([rq.account_id, rq.private_key, rq.method, rq.receiver_id, rq.referrer], res);
    // TODO: 'attachedNear' and 'callbackUrl' should be checked too?

    try {
        const nearAccount = await getAccount(rq.account_id, rq.private_key);
        const transactionManager = TransactionManager.fromAccount(nearAccount);

        const transaction = await transactionManager.createTransaction({
            receiverId: rq.receiver_id,
            actions: [functionCall(rq.method, rq.args || {}, DEFAULT_FUNCTION_CALL_GAS, new BN(utils.format.parseNearAmount(rq.attachedNear)))],
        });

        const walletUrl = getSigningTransactionsWalletUrl([transaction], rq.referrer, rq.callbackUrl);

        res.status(200).json(
            {
                success: true,
                url: walletUrl
            }
        );
    }
    catch (err) {
        res.status(400).json(
            {
                success: false,
                error: "Invalid credentials"
            }
        );
    }
}
