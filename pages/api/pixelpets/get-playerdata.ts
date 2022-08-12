import type { NextApiRequest, NextApiResponse } from 'next'
import { scaled_pets_by_ids } from '../../../utils/backend/pixelpets/helper/pet_scaling';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { checkDecreaseRating, getAccountData } from '../../../utils/backend/pixelpets/helper/basic_game';

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
        const accountdata = await getAccountData(rq.account_id);

        if (!await checkDecreaseRating(rq.account_id, accountdata, res)) {
            return;
        }

        const playerdata = accountdata.playerdata;
        const pet_ids = playerdata.pet_ids as string[];

        accountdata.pets = await scaled_pets_by_ids(pet_ids);
        playerdata.pet_ids = undefined;
        accountdata.maintenance = false;

        //console.log(playerdata.pets);
        res.status(200).json({ success: true, data: accountdata });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "get_player_data");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}
