import type { NextApiRequest, NextApiResponse } from 'next'
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { logCryptoHeroErrorDb } from '../../../utils/backend/common/mongo-helper';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { getCharacterWithPosition, getLeaderboard } from '../../../utils/backend/cryptohero/helper/basic_game';
import { ClassType } from '../../../utils/backend/cryptohero/dungeon/types';

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
        const mage_entries: any[] = [];
        const knight_entries: any[] = [];
        const ranger_entries: any[] = [];
        const max_results = 50;

        const mageWithPos = await getCharacterWithPosition(rq.account_id, ClassType.Mage);
        if (mageWithPos) {
            mage_entries.push(mageWithPos);
        }

        const knightWithPos = await getCharacterWithPosition(rq.account_id, ClassType.Knight);
        if (knightWithPos) {
            knight_entries.push(knightWithPos);
        }

        const rangerWithPos = await getCharacterWithPosition(rq.account_id, ClassType.Ranger);
        if (rangerWithPos) {
            ranger_entries.push(rangerWithPos);
        }

        await getLeaderboard(ClassType.Mage, max_results).then(x => {
            x.forEach(x => mage_entries.push(x));
        });

        await getLeaderboard(ClassType.Knight, max_results).then(x => {
            x.forEach(x => knight_entries.push(x));
        });

        await getLeaderboard(ClassType.Ranger, max_results).then(x => {
            x.forEach(x => ranger_entries.push(x));
        });

        res.status(200).json({
            success: true,
            data: {
                mage: mage_entries,
                knight: knight_entries,
                ranger: ranger_entries,
            }
        });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "get-leaderboard");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}