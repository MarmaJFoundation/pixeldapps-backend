import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { get_units_by_ids } from '../../../utils/backend/chainteamtactics/helper/data_loader';
import { logChainTeamTacticsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { getAccountData, getPlayerWithPosition } from '../../../utils/backend/chainteamtactics/helper/basic_game';
import { getAllNotifications } from '../../../utils/backend/chainteamtactics/helper/utils';

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
        const playerdata = await getAccountData(rq.account_id);
        const unit_ids = playerdata.playerdata.unit_ids as string[];

        playerdata.units = await get_units_by_ids(unit_ids);
        playerdata.playerdata.unit_ids = undefined;
        playerdata.notifications = await getAllNotifications(rq.account_id);
        playerdata.maintenance = false;

        res.status(200).json({ success: true, data: playerdata });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "get-playerdata");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}