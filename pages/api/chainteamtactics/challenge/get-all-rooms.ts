import type { NextApiRequest, NextApiResponse } from 'next'
import { getAccountData, getPlayerWithPosition } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { GetAllRoomsRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { getOpenRooms, getRoomByLeader } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: GetAllRoomsRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey], res)) {
        return;
    }

    // as this endpoint now takes the player rank into account to filter rooms by the rank
    // ensure that the player isn't faking the request with someone's else name to get easier rooms
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    try {
        const accountdata = await getAccountData(rq.account_id);
        const playerdata = accountdata.playerdata;
        
        const rooms: any[] = [];

        const ownRoom = await getRoomByLeader(rq.account_id);

        if (ownRoom && ownRoom.playerFightWins.length > 0) {
            rooms.push({
                account_id: ownRoom.account_id,
                betType: ownRoom.betType,
                won: ownRoom.playerFightWins[0],
                lost: ownRoom.playerFightWins[1],
                rank: ownRoom.playerRanks[0],
                loadout: ownRoom.playerLoadouts[0].map(x => {
                    const data = {
                        token_id: x.token_id,
                        unit_type: x.unit_type,
                    };
                    return data;
                }),
            });
        }

        const allRooms = await getOpenRooms(rq.account_id, playerdata.rating - 400);

        if (allRooms.length != 0) {
            allRooms.forEach(room => {
                rooms.push({
                    account_id: room.account_id,
                    betType: room.betType,
                    won: room.playerFightWins[0],
                    lost: room.playerFightWins[1],
                    rank: room.playerRanks[0],
                    loadout: room.playerLoadouts[0].map(x => {
                        const data = {
                            token_id: x.token_id,
                            unit_type: x.unit_type,
                        };
                        return data;
                    }),
                });
            });
        }

        res.status(200).json({ success: true, data: rooms });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "get-all-rooms");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}