import type { NextApiRequest, NextApiResponse } from 'next'
import { getLeaderboard, getTournament } from '../../../utils/backend/pixelpets/helper/basic_game';
import { setup_headers } from '../../../utils/backend/common/rq_utils';
import { getPixelPetsDb, logPixelPetsErrorDb } from '../../../utils/backend/common/mongo-helper';
import { getCurrentWeekCode, getNextWeekTimestamp } from '../../../utils/backend/common/utils';
import { FunctionRequest } from '../../../utils/backend/common/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);
    const rq: FunctionRequest = req.body;
    try {
        const db = await getPixelPetsDb();
        const w_code = getCurrentWeekCode();
        const leaderboard_entries: any[] = []
        const tournament_entries: any[] = []
        // when the client provides its own account_id
        // no matter the player are or not on top100
        // it'll appear at first entry
        if (rq.account_id) {
            const x = await db.collection("leaderboard").findOne(
                { account_id: rq.account_id },
                {
                    projection: {
                        _id: 0,
                        last_fight: 0,
                        player_loadout: {
                            pet_level: 0,
                            pet_trainLevel: 0,
                            pet_power_level: 0,
                            pet_experience: 0,
                        }
                    }
                });
            if (x) {
                const index = await db.collection("leaderboard")
                    .find({})
                    .sort({
                        player_rating: -1,
                    })
                    .toArray()
                    .then(a => a.findIndex(b => b.account_id == x.account_id));
                x["position"] = index + 1;
                leaderboard_entries.push(x);
            }

            const x2 = await db.collection("tournament").findOne(
                { account_id: rq.account_id, week_code: w_code, },
                {
                    projection: {
                        _id: 0,
                        last_fight: 0,
                        week_code: 0,
                        created_at: 0,
                    }
                });
            if (x2) {
                const index = await db.collection("tournament")
                    .aggregate([
                        {
                            $match: {
                                week_code: w_code
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                account_id: 1,
                                matches_lost: 1,
                                matches_won: 1,
                                score: {
                                    $subtract: ["$matches_won", "$matches_lost"]
                                }
                            }
                        },
                        {
                            $sort: {
                                score: -1
                            }
                        }
                    ])
                    .toArray()
                    .then(a => a.findIndex(b => b.account_id == x2.account_id));
                x2["position"] = index + 1;
                tournament_entries.push(x2);
            }
        }

        await getLeaderboard(50).then(x => {
            x.forEach(x => leaderboard_entries.push(x));
        });

        await getTournament(w_code, 50).then(x => {
            x.forEach(x => tournament_entries.push(x));
        });

        res.status(200).json({
            success: true,
            data: {
                leaderboard: leaderboard_entries,
                tournament: tournament_entries,
                active_tournament: w_code,
                tournament_ends: getNextWeekTimestamp()
            }
        });
    }
    catch (err) {
        await logPixelPetsErrorDb(err, rq.account_id, "get_leaderboard");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}


