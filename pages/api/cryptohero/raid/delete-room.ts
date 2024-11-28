import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../../utils/backend/common/blockchain';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../../utils/backend/common/types';
import { getCurrentWeekCode, is_testnet_env } from '../../../../utils/backend/common/utils';
import { getRoomByLeader } from '../../../../utils/backend/cryptohero/raid/utils';

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
        if (!is_testnet_env()) {
            throw "Not possible";
        }

        const w_code = getCurrentWeekCode();
        const roomData = await getRoomByLeader(rq.account_id, w_code);

        if (!roomData) {
            return res.status(200).json({ success: false });
        }

        const response = await changeFunctionWithoutAttachment(
            MANAGER_ACCOUNT,
            MANAGER_KEY,
            APP_CONTRACT,
            "ch_delete_raid",
            {
                account_id: roomData.account_id,
                week_code: roomData.week_code,
            },
            new BN('150000000000000')// 150
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        const db = await getCryptoHeroDb();

        await db.collection("rooms").deleteOne({
            account_id: roomData.account_id,
            week_code: roomData.week_code
        });

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "delete-rom");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}