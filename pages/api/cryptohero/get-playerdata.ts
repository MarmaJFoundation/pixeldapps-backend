import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, viewFunction } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logCryptoHeroErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { get_characters_by_ids, get_items_by_ids } from '../../../utils/backend/cryptohero/helper/data_loader';
import { getInventoryData } from '../../../utils/backend/cryptohero/helper/basic_game';
import { ItemToken, PotionData } from '../../../utils/backend/cryptohero/helper/types';
import { GetPotionData } from '../../../utils/backend/cryptohero/helper/utils';
import { PotionType } from '../../../utils/backend/cryptohero/dungeon/types';

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
        const playerdata = await viewFunction(
            APP_CONTRACT,
            "ch_get_player_data",
            { account_id: rq.account_id }
        );

        const item_ids = playerdata.playerdata.item_ids as string[];
        const char_ids = playerdata.playerdata.character_ids as string[];

        playerdata.items = await get_items_by_ids(item_ids);
        playerdata.characters = await get_characters_by_ids(char_ids);

        const item_tokens: string[] = playerdata.items.map((x: ItemToken) => x.token_id);

        for (let i = 0; i < playerdata.characters.length; i++) {
            const character = playerdata.characters[i];
            const inventoryData = await getInventoryData(rq.account_id, character.class_type);
            const inventory_tokens: string[] = [];

            // filter tokens that the player does not own anymore
            for (let j = 0; j < inventoryData.length; j++) {
                const x = inventoryData[j];
                if (item_tokens.includes(x.token_id)) {
                    inventory_tokens.push(x.token_id);
                }
            }

            character.character_id = undefined;
            character["inventory"] = inventory_tokens;

            character["strengthPotion"] = GetPotionData(character.potions, PotionType.Strength) || new PotionData(PotionType.Strength);
            character["staminaPotion"] = GetPotionData(character.potions, PotionType.Stamina) || new PotionData(PotionType.Stamina);
            character["luckPotion"] = GetPotionData(character.potions, PotionType.Luck) || new PotionData(PotionType.Luck);

            character.potions = undefined;
        }

        playerdata.playerdata.item_ids = undefined;
        playerdata.playerdata.character_ids = undefined;
        playerdata.playerdata.joined_raids = undefined;
        playerdata.maintenance = false;

        res.status(200).json({ success: true, data: playerdata });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "get-playerdata");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}