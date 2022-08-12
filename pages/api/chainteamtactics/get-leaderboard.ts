import type { NextApiRequest, NextApiResponse } from 'next'
import { getLeaderboard, getPlayerWithPosition } from '../../../utils/backend/chainteamtactics/helper/basic_game';
import { logChainTeamTacticsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../utils/backend/common/types';

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
        const entries: any[] = [];
        const max_results = 100;

        const playerWithPosition = await getPlayerWithPosition(rq.account_id);
        if (playerWithPosition) {
            entries.push(playerWithPosition);
        }

        await getLeaderboard(max_results).then(x => {
            x.forEach(x => entries.push(x));
        });

        res.status(200).json({
            success: true,
            data: entries
        });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "get-leaderboard");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}