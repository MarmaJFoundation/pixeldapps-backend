import type { NextApiRequest, NextApiResponse } from 'next'
import { changeFunctionWithoutAttachment, checkFunctionResponse } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { DEFAULT_FUNCTION_CALL_GAS } from 'near-api-js';
import BN from 'bn.js';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey, rq.contract_id, rq.method_name/*, rq.args*/], res)) {
        return;
    }
    try {
        if (Object.keys(rq.args).length) {
            rq.args = JSON.parse(rq.args);
        }
        else {
            rq.args = {};
        }

        let attachedGas = DEFAULT_FUNCTION_CALL_GAS;

        if(rq.raise_gas) {
            attachedGas =  new BN('110000000000000')// 110
        }

        const response = await changeFunctionWithoutAttachment(rq.account_id, rq.privatekey, rq.contract_id, rq.method_name, rq.args, attachedGas);
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        //console.log(response);
        //check for contract panic
        res.status(200).json({ success: true, data: response.data });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "changeFunction");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }

}
