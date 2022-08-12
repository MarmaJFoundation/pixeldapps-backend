import BN from 'bn.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPetBaseData } from '../../../utils/backend/pixelpets/helper/basic_game';
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse } from '../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { PetToken } from '../../../utils/backend/pixelpets/helper/types';
import { generateCardStats } from '../../../utils/backend/pixelpets/fight/utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey], res)) {
        return;
    }
    try {
        const pet_base_data = await getPetBaseData();
        const response = await changeFunctionWithoutAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "open_egg", {}, new BN('45000000000000'));
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        const pet = response.data as unknown as PetToken;

        //console.log(pet);
        const petbase = pet_base_data.find(x => x.pet_id == pet.pet_type);
        if (petbase == null) {
            throw "pettype not found";
        }

        pet["combat_info"] = generateCardStats(petbase, pet.rarity, pet.train_level, pet.level, petbase.evolution, pet.power_level, true)

        res.status(200).json({ success: true, data: pet });
    }
    catch (err) {
        // console.log(err);
        //const em = (err.kind.ExecutionError as string);
        //log em to mongodb
        await logPixelPetsErrorDb(err, rq.account_id, "open_egg");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}
