import type { NextApiRequest, NextApiResponse } from 'next'
import { logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getPgClient } from '../../../../utils/backend/common/pgdb';
import { _onlyPxDapps } from '../../../../utils/backend/common/blockchain';
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
        //_onlyPxDapps(rq.account_id);

        let data: any = "";
        const client = getPgClient();

        await client.connect();
        try {
            data = await client.query(`
                SELECT 
                    ara.args->'args_json'->'token_id' as token_id,
                    ara.args->'args_json'->'owner' as owner,
                    ara.args->'args_json'->'buyer' as buyer,
                    ara.args->'args_json'->'price' as price,
                    eo.executed_in_block_timestamp as datetime
                FROM
                    action_receipt_actions ara
                INNER JOIN
                    execution_outcomes eo ON ara.receipt_id = eo.receipt_id
                WHERE
                    ara.action_kind = 'FUNCTION_CALL' AND
                    ara.args->>'method_name' = 'marketplace_buy' AND
                    ara.receipt_receiver_account_id = 'pixeltoken.near' AND
                    eo.status = 'SUCCESS_VALUE' AND
                    ara.receipt_included_in_block_timestamp > `+ (Date.now() * 1000000 - (86400000000000 * 2)) + `
                ORDER BY
                    eo.executed_in_block_timestamp DESC
                LIMIT 100
            `);

            data["map"] = data.rows.map(x => {
                x.datetime = new Date(x.datetime / 1000000);
                return x;
            });
        }
        catch (ierr) {
            throw ierr;
        }
        finally {
            await client.end();
        }

        res.status(200).json({ success: true, data: data.map });
    }
    catch (err) {
        console.log(err);
        await logPixelPetsErrorDb(err, rq.account_id, "get-sold-pets-pg2");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}