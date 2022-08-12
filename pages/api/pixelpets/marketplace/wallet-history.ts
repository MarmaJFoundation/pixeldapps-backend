import type { NextApiRequest, NextApiResponse } from 'next'
import { logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getPgClient } from '../../../../utils/backend/common/pgdb';
import { FunctionRequest } from '../../../../utils/backend/common/types';

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
        let data: any = "";
        const client = getPgClient();

        await client.connect();
        try {
            data = await client.query(`
                SELECT 
                    ara.args->'args_json'->'token_id' as token_id,
                    ara.args->'args_json'->'owner' as owner,
                    ara.args->'args_json'->'buyer' as buyer,
                    ara.args->'args_json'->'price' as price
                FROM
                    action_receipt_actions ara
                INNER JOIN
                    execution_outcomes eo ON ara.receipt_id = eo.receipt_id
                WHERE
                    ara.action_kind = 'FUNCTION_CALL' AND
                    ara.args->'args_json'->>'owner' = $1 AND
                    ara.args->>'method_name' = 'marketplace_buy' AND
                    ara.receipt_receiver_account_id = 'pixeltoken.near' AND
                    eo.status = 'SUCCESS_VALUE'
                ORDER BY
                    eo.executed_in_block_timestamp DESC
                LIMIT 10
            `, [rq.account_id]);
        }
        catch (ierr) {
            throw ierr;
        }
        finally {
            await client.end();
        }

        res.status(200).json({ success: true, data: data.rows });
    }
    catch (err) {
        console.log(err);
        await logPixelPetsErrorDb(err, rq.account_id, "get-sold-pets-pg");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}