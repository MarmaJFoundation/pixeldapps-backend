import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from '../../../../utils/backend/common/blockchain';
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { ItemData } from '../../../../utils/backend/cryptohero/dungeon/types';
import { deleteLootbox, getLootbox } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { OpenLootboxRequest } from '../../../../utils/backend/cryptohero/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: OpenLootboxRequest = req.body;

    if (!is_valid_request([rq.account_id], res)) {
        return;
    }

    if (!is_defined_request([rq.rarity_type, rq.item1_index, rq.item2_index], res)) {
        return;
    }

    try {
        const lootBoxItems: ItemData[] = await getLootbox(rq.account_id, rq.rarity_type);

        if (!lootBoxItems) {
            throw "No lootbox found";
        }

        if (rq.item1_index < 0 || rq.item1_index >= lootBoxItems.length ||
            rq.item2_index < 0 || rq.item2_index >= lootBoxItems.length) {
            throw "Invalid index";
        }

        const response = await changeFunctionWithoutAttachment(
            MANAGER_ACCOUNT,
            MANAGER_KEY,
            APP_CONTRACT,
            "ch_open_presale_box",
            {
                account_id: rq.account_id,
                item1: lootBoxItems[rq.item1_index],
                item2: lootBoxItems[rq.item2_index],
            },
            new BN('25000000000000')// 25
        );

        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }

        await deleteLootbox(rq.account_id, rq.rarity_type);
        res.status(200).json({ success: true });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "open-lootbox");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}