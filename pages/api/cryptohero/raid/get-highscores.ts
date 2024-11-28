import type { NextApiRequest, NextApiResponse } from 'next'
import { logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { setup_headers, is_valid_request, is_defined_request } from '../../../../utils/backend/common/rq_utils';
import { is_testnet_env } from '../../../../utils/backend/common/utils';
import { getRaidscores, getRoomWithPosition } from '../../../../utils/backend/cryptohero/helper/basic_game';
import { RaidScoresRequest } from '../../../../utils/backend/cryptohero/helper/types';
import { getRoom, RaidPlayersCount } from '../../../../utils/backend/cryptohero/raid/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: RaidScoresRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.raiddata], res)) {
        return;
    }

    if (!is_defined_request([rq.raiddata.difficulty], res)) {
        return;
    }

    try {
        const entries: any[] = [];
        const max_results = 30;

        let roomData = await getRoom(rq.account_id);
        if (roomData &&
            (is_testnet_env() || roomData.playerNames.length == RaidPlayersCount) &&
            roomData.difficulty == rq.raiddata.difficulty) {
            roomData = await getRoomWithPosition(roomData);
            if (roomData) {
                roomData.week_code =
                    roomData.difficulty =
                    roomData.playerEquippedItems =
                    roomData.playerLevels =
                    roomData.playerStatStructs =
                    undefined;
                entries.push(roomData);
            }
        }

        await getRaidscores(rq.raiddata.difficulty, max_results).then(x => {
            x.forEach(x => entries.push(x));
        });

        res.status(200).json({
            success: true,
            data: entries,
        });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "get-highscores");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}