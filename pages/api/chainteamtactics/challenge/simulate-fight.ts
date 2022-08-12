import type { NextApiRequest, NextApiResponse } from 'next'
import { BattleController } from '../../../../utils/backend/chainteamtactics/battle/core';
import { UnitInfo } from '../../../../utils/backend/chainteamtactics/battle/types';
import { getPlayerData, lockAccount, unlockAccount } from '../../../../utils/backend/chainteamtactics/helper/basic_game';
import { ChallengeRequest, EndCreateRoomRequest, LockType, RoomNotificationType } from '../../../../utils/backend/chainteamtactics/helper/types';
import { createOrUpdateRoom, createOrUpdateRoomNotification, deleteNotification, deleteRoomAndFinishFight, getRoomByLeader } from '../../../../utils/backend/chainteamtactics/helper/utils';
import { logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { is_trusted_requestor, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { assert, to_number } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: ChallengeRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.privatekey, rq.publickey, rq.leader_id, rq.player_loadout], res)) {
        return;
    }

    // should be almost impossible to someone fake a fighting request
    // in someone's else turn with all correct tokens and coordinates
    // but who knows... its better ensure its one of the two players
    if (!await is_trusted_requestor(rq.account_id, rq.privatekey, rq.publickey, res)) {
        return;
    }

    let lockTaken: boolean = false;
    try {
        lockTaken = await lockAccount(rq.account_id, LockType.Battle);
        assert(lockTaken, "account is locked for Battle");

        const roomData = await getRoomByLeader(rq.leader_id);

        assert(roomData, "room not found");
        assert(roomData.playerNames.length == 2, roomData.playerNames.length == 0 ? "room is not ready" : "room is open");
        assert(roomData.playerNames.includes(rq.account_id), "you are not in the room");
        assert(roomData.prev_round_id != rq.account_id, "it's not your round");

        const index = roomData.playerNames.indexOf(rq.account_id);
        const playerdata = await getPlayerData(rq as unknown as EndCreateRoomRequest, roomData.mapIndex, index == 1);

        // update player's loadout
        if (roomData.round_nr != 0) {
            roomData.playerLoadouts[index] = playerdata.player_loadout;
        }
        else {
            roomData.playerLoadouts.push(playerdata.player_loadout);
        }

        // generate all required fight structs
        const yellowLoadout = roomData.playerLoadouts[0].map(x => {
            const unitInfo = {
                unitID: to_number(x.token_id),
                unitType: x.unit_type,
                speed: x.speed,
                damage: x.damage,
                health: x.health,
            } as UnitInfo;
            return unitInfo;
        });
        const yellowPosition = roomData.playerLoadouts[0].map(x => x.position);

        const purpleLoadout = roomData.playerLoadouts[1].map(x => {
            const unitInfo = {
                unitID: to_number(x.token_id),
                unitType: x.unit_type,
                speed: x.speed,
                damage: x.damage,
                health: x.health,
            } as UnitInfo;
            return unitInfo;
        });
        const purplePosition = roomData.playerLoadouts[1].map(x => x.position);

        const battleController: BattleController = new BattleController();
        const results = battleController.GenerateFightStruct(roomData.mapIndex,
            purpleLoadout, purplePosition,
            yellowLoadout, yellowPosition
        );

        roomData.playerNames.map(x => results.playerNames.push(x));
        roomData.playerRanks.map(x => results.playerRanks.push(x));
        results.playerLoadouts.push(roomData.playerLoadouts[0].map(x => x));
        results.playerLoadouts.push(roomData.playerLoadouts[1].map(x => x));

        const roundWinnerIndex: number = !results.purpleWins ? 0 : 1;
        const roundLoserIndex: number = roundWinnerIndex == 1 ? 0 : 1;

        roomData.playerRoundWins[roundWinnerIndex]++;
        roomData.prev_round_winner = roomData.playerNames[roundWinnerIndex];
        roomData.prev_round_loser = roomData.playerNames[roundLoserIndex];
        roomData.prev_round_id = rq.account_id;
        roomData.notify_id = roomData.playerNames[roomData.round_nr % 2];
        roomData.last_activity = Date.now();
        roomData.round_nr++;

        let notify_type: RoomNotificationType = RoomNotificationType.RoundFinish;
        let fightWinnerIndex: number = -1;
        let fightLoserIndex: number = -1;

        for (let i: number = 0; i < roomData.playerRoundWins.length; i++) {
            if (roomData.playerRoundWins[i] >= 2) {
                notify_type = RoomNotificationType.FightFinish;
                fightLoserIndex = i == 1 ? 0 : 1;
                fightWinnerIndex = i;
                break;
            }
        }

        if (notify_type == RoomNotificationType.FightFinish) {
            if (!await deleteRoomAndFinishFight(roomData, fightWinnerIndex, fightLoserIndex, true, res)) {
                return;
            }
        }
        else {
            await createOrUpdateRoom(roomData);
        }

        // only needed on the first round
        if (roomData.round_nr == 1) {
            await deleteNotification(RoomNotificationType.PendingJoin, roomData);
        }

        await createOrUpdateRoomNotification(notify_type, roomData, results);
        res.status(200).json({ success: true, data: results });
    }
    catch (err) {
        await logChainTeamTacticsErrorDb(err, rq.account_id, "simulate-fight");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
    finally {
        if (lockTaken) {
            await unlockAccount(rq.account_id, LockType.Battle);
        }
    }
}