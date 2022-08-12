import type { NextApiRequest, NextApiResponse } from 'next'
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, _onlyPxDapps } from '../../../../utils/backend/common/blockchain';
import { is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { EditPetRequest } from '../../../../utils/backend/pixelpets/helper/types';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../../utils/backend/common/mongo-helper';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: EditPetRequest = req.body;
    if (!is_valid_request([rq.account_id, rq.privatekey, rq.password, rq.petdata], res)) {
        return;
    }
    try {
        _onlyPxDapps(rq.account_id, rq.password);
        const db = await getPixelPetsDb();
        const options = { upsert: true };
        //console.log(db_insert);
        const response = await changeFunctionWithoutAttachment(rq.account_id, rq.privatekey, APP_CONTRACT, "insert_update_pet", { petdata: rq.petdata });
        if (!checkFunctionResponse(response)) {
            return res.status(200).json({ success: false, error: response.error.type });
        }
        //console.log(response);
        const db_insert = await db.collection("pets").replaceOne({ pet_id: rq.petdata.pet_id }, rq.petdata, options);

        res.status(200).json({ success: true });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "edit-pet");
        res.status(200).json({ success: false, error: "Check transaction error on wallet." });
    }
}
