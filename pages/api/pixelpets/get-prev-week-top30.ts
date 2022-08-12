import type { NextApiRequest, NextApiResponse } from 'next'
import { getTournament } from '../../../utils/backend/pixelpets/helper/basic_game';
import { setup_headers } from '../../../utils/backend/common/rq_utils';
import { logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { getPreviousWeekCode } from '../../../utils/backend/common/utils';
import { FunctionRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;
    try {
        const w_code = getPreviousWeekCode();
        const entries = await getTournament(w_code, 30);

        res.status(200).json({
            success: true,
            data: {
                tournament: entries,
                active_tournament: w_code,
            }
        });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "get-prev-week-top30");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}


