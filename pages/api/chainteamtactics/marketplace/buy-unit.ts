import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { BuyUnitRequest, UnitToken } from '../../../../utils/backend/chainteamtactics/helper/types';
import { APP_CONTRACT, changeFunctionWithAttachment, checkFunctionResponse } from '../../../../utils/backend/common/blockchain';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: BuyUnitRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.unitdata, rq.unitdata?.token_id], res)) {
        return;
    }

    try {
        const db = await getChainTeamTacticsDb();
        const entry = await db.collection("marketplace").findOne({ token_id: rq.unitdata.token_id });
        const unit_token = entry.unit_data as UnitToken;

        if (entry && unit_token.owner == rq.account_id) {
            throw "You can't buy your own unit";
        }

        const response = await changeFunctionWithAttachment(
            rq.account_id,
            rq.privatekey,
            APP_CONTRACT,
            "ctt_buy_unit",
            { token_id: rq.unitdata.token_id, owner: unit_token.owner, buyer: rq.account_id, price: entry.price },
            new BN('1'),
            "https://ecosystem.pixeldapps.co/callback?page=unit_bought",
            new BN('150000000000000')// 150???
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await db.collection("marketplace").deleteOne({ token_id: rq.unitdata.token_id });

        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "buy-unit");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}