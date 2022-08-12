import type { NextApiRequest, NextApiResponse } from 'next'
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../../utils/backend/common/types';
import { getAccountData } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { get_items_by_ids } from '../../../../utils/backend/cryptohero/helper/data_loader';
import { ItemToken } from '../../../../utils/backend/cryptohero/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    return res.status(404).json({ error: "404 - Not Found" });
    // setup_headers(req, res);

    // const rq: FunctionRequest = req.body;

    // if (!is_valid_request([rq.account_id], res)) {
    //     return;
    // }

    // try {
    //     const db = await getCryptoHeroDb();
    //     const entries = await db.collection("marketplace_check").find(
    //         { owner: rq.account_id },
    //         { projection: { _id: 0, token_id: 1, buyer: 1 } }
    //     ).toArray();

    //     const keys: string[] = [];
    //     const keyValuePair: { [Key: string]: string[] } = {};

    //     entries.forEach(x => {
    //         if (!keyValuePair[x.buyer]) {
    //             keyValuePair[x.buyer] = [];
    //             keys.push(x.buyer);
    //         }

    //         keyValuePair[x.buyer].push(x.token_id);
    //     });

    //     let item_tokens: ItemToken[] = [];

    //     for (let i = 0; i < keys.length; i++) {
    //         const account_id: string = keys[i];
    //         const token_ids: string[] = keyValuePair[account_id];

    //         const accountdata = await getAccountData(account_id);
    //         const playerdata = accountdata.playerdata;
    //         const item_ids = playerdata.item_ids as string[];

    //         const existent_ids: string[] = [];

    //         for (let j = 0; j < token_ids.length; j++) {
    //             if (item_ids.includes(token_ids[j])) {
    //                 existent_ids.push(token_ids[j]);
    //             }
    //         }

    //         item_tokens = item_tokens.concat(await get_items_by_ids(existent_ids));
    //     }

    //     res.status(200).json({ success: true, data: item_tokens });
    // }
    // catch (err) {
    //     console.log(err);
    //     // await logCryptoHeroErrorDb(err, rq.account_id, "completed-offers");
    //     res.status(200).json({ success: false, error: "Contact discord support" });
    // }
}