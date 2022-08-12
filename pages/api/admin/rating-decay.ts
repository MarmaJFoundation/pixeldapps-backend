import type { NextApiRequest, NextApiResponse } from 'next'
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { clamp } from '../../../utils/backend/common/utils';
import { getInactivePlayers, isRatingDecayAllowed } from '../../../utils/backend/pixelpets/helper/basic_game';
import { _onlyPxDapps } from '../../../utils/backend/common/blockchain';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;

    if (!is_valid_request([rq.account_id], res)) {
        return;
    }

    if (rq["readonly"] == undefined) {
        rq["readonly"] = true;
    }

    const is_readonly: boolean = rq["readonly"];

    try {
        _onlyPxDapps(rq.account_id);

        if (!is_readonly && !await isRatingDecayAllowed()) {
            return res.status(403).json({ error: "403 - Forbidden" });
        }

        const db = await getPixelPetsDb();
        const entries = await getInactivePlayers();

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            const elapsedDays = clamp(entry.elapsed_days, 1, 31);
            const penalty = Math.pow(2, elapsedDays);
            const ratingThen = entry.player_rating;
            const ratingNow = clamp(entry.player_rating - penalty, 800, entry.player_rating);

            entry["elapsed_days_clamp"] = elapsedDays;
            entry["rating_penalty"] = penalty;
            entry["new_rating"] = ratingNow;

            if (!is_readonly) {
                await db.collection("leaderboard")
                    .updateOne(
                        { account_id: entry.account_id },
                        { $set: { "player_rating": ratingNow } });
            }

            // console.log(`[${entry.account_id}] days since lastfight: ${elapsedDays}, rating then: ${ratingThen}, penalty: ${penalty}, rating now: ${ratingNow}`);// dev log
        }

        // console.log(`entries: ${entries.length}`);// dev log
        res.status(200).json({ success: true, data: { entries: entries, changes: !is_readonly ? entries.length : 0 } });
    }
    catch (err) {
        // console.log(err);// dev log
        await logPixelPetsErrorDb(err, rq.account_id, "rating-decay");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}