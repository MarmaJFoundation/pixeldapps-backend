import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, viewFunction } from '../../../../utils/backend/common/blockchain';
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_defined_request, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { ItemData } from '../../../../utils/backend/cryptohero/dungeon/types';
import { checkLootboxBalance, createLootbox, getLootbox } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { RequestLootboxRequest } from '../../../../utils/backend/cryptohero/helper/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: RequestLootboxRequest = req.body;

    if (!is_valid_request([rq.account_id], res)) {
        return;
    }

    if (!is_defined_request([rq.rarity_type], res)) {
        return;
    }

    try {
        const playerdata = await viewFunction(
            APP_CONTRACT,
            "ch_get_player_data",
            { account_id: rq.account_id }
        );
        const balance = playerdata.balance;

        if (!checkLootboxBalance(balance, rq.rarity_type)) {
            throw "You don't have lootboxes left";
        }

        let lootBoxItems: ItemData[] = await getLootbox(rq.account_id, rq.rarity_type);
        if (!lootBoxItems) {
            lootBoxItems = await createLootbox(rq.account_id, rq.rarity_type);
        }
        res.status(200).json({ success: true, data: lootBoxItems });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "request-lootbox");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}