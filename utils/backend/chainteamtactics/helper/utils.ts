import BN from "bn.js";
import { NextApiResponse } from "next";
import { APP_CONTRACT, changeFunctionWithoutAttachment, checkFunctionResponse, MANAGER_ACCOUNT, MANAGER_KEY } from "../../common/blockchain";
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from "../../common/mongo-helper";
import { getRandomNumber, is_testnet_env } from "../../common/utils";
import { FightStruct, MapData, MapType, UnitData } from "../battle/types";
import { CACHED_MAPBASE_DATA, CACHED_UNITBASE_DATA, getAccountData, updateLeaderboard } from "./basic_game";
import { PlayerLoadoutData, RoomData, RoomNotificationData, RoomNotificationType } from "./types";

export const MaxUnitsPerAccount: number = 36;
export const MaxUnitsPerTeam: number = 6;
export const MaxJoinedRooms: number = 5;

export function getUnitByType(unitType: number): UnitData {
    return CACHED_UNITBASE_DATA.find(x => x.unit_type == unitType);
}

export function getMapByType(mapType: number): MapData {
    return CACHED_MAPBASE_DATA.find(x => x.map_type == mapType);
}

export function get_random_map(): number {
    // TODO: edit here when more maps get added
    // PS. 'Tavern' is exclusive for the game menu
    const playableMaps: MapType[] = [
        MapType.Bridge,
        MapType.Temple,
        MapType.Volcano,
    ];
    return playableMaps[getRandomNumber(0, playableMaps.length)];
}

// rooms

export async function createOrUpdateRoom(roomData: RoomData): Promise<void> {
    const db = await getChainTeamTacticsDb();
    await db.collection("rooms").updateOne(
        { account_id: roomData.account_id },
        { $set: roomData },
        { upsert: true });
}

async function deleteRoom(roomData: RoomData): Promise<void> {
    const db = await getChainTeamTacticsDb();
    await db.collection("rooms").deleteOne({ account_id: roomData.account_id });
}

export async function getAllJoinedRooms(account_id: string): Promise<RoomData[]> {
    const db = await getChainTeamTacticsDb();
    const roomData = await db.collection("rooms").find<RoomData>(
        {
            account_id: {
                $ne: account_id
            },
            playerNames: account_id
        },
        { projection: { _id: 0 } }
    ).toArray();
    return roomData;
}

export async function getAllInactiveRooms(account_id: string): Promise<RoomData[]> {
    const db = await getChainTeamTacticsDb();
    const timeOffset = !is_testnet_env() ? 86400000 : 3600000;
    const roomData = await db.collection("rooms").find<RoomData>(
        {
            playerNames: account_id,
            last_activity: {
                $lte: Date.now() - timeOffset,
                $gt: 0,// filter brandnew rooms
            }
        },
        { projection: { _id: 0 } }
    ).toArray();
    return roomData;
}

export async function getRoomByLeader(account_id: string): Promise<RoomData | null> {
    const db = await getChainTeamTacticsDb();
    const roomData = await db.collection("rooms").findOne<RoomData>(
        { account_id: account_id },
        { projection: { _id: 0 } }
    );
    return roomData || null;
}

export async function getOpenRooms(account_id: string, min_rating: number, results: number = 50): Promise<RoomData[]> {
    const db = await getChainTeamTacticsDb();
    const rating_filter = !is_testnet_env() ? min_rating - 50 : 0;
    const entries = await db.collection("rooms").aggregate([
        {
            $project: {
                _id: 0,
                account_id: 1,
                betType: 1,
                playerNames: 1,
                playerRanks: 1,
                playerFightWins: 1,
                playerLoadouts: 1,
                playersCount: { $size: "$playerNames" },
            }
        },
        {
            $match: {
                // only index rooms with 1 player (the creator itself)
                // when player start creating a room, there are 0 players in it
                // when the player finish creating a room, there are 1 players in it
                // when another player join a room, there are 2 players
                // so, only rooms with 1 player can be shown
                playersCount: 1,
                // filter all rooms on which the rank are too low for the player
                "playerRanks.0": {
                    $gte: rating_filter
                },
                // filter the room the player are currently leading
                account_id: {
                    $ne: account_id,
                },
            }
        },
        {
            $sort: {
                "playerRanks.0": -1
            }
        },
        {
            $limit: results
        }
    ]).toArray();
    return entries as RoomData[];
}

// notifications

export async function createOrUpdateRoomNotification(notify_type: RoomNotificationType, roomData: RoomData, fightStruct: FightStruct | null = null): Promise<void> {
    const db = await getChainTeamTacticsDb();
    const notify_players: string[] = [];
    const player_loadout: PlayerLoadoutData[] = [];
    let new_room_id: string = roomData.account_id;
    // when a fight finished or the room gets closed
    // we must change its name to avoid conflics later
    // since these notifications can live undefinetely
    // and will get overriden if the player creates a new room
    if (notify_type == RoomNotificationType.FightFinish ||
        notify_type == RoomNotificationType.ClosedRoom) {
        new_room_id = `${new_room_id}.${Date.now()}`;
    }
    // notify the player who started creating a room
    // in case something goes wrong (game crashes, page refresh...)
    if (notify_type == RoomNotificationType.PendingCreate) {
        notify_players.push(roomData.account_id);
    }
    // notify the player who joined the room with leader's loadout
    // in case something goes wrong (game crashes, page refresh...)
    else if (notify_type == RoomNotificationType.PendingJoin) {
        notify_players.push(roomData.playerNames[1]);
        roomData.playerLoadouts[0].map(x => x).forEach(x => player_loadout.push(x));
    }
    // notify the other player about next round
    else if (notify_type == RoomNotificationType.RoundFinish) {
        notify_players.push(roomData.notify_id);
    }
    // when fight is over or room gets closed, both players should be notified
    else {
        roomData.playerNames.forEach(x => notify_players.push(x));
    }
    const filter = {
        room_id: roomData.account_id,
    };
    const update = {
        $set: {
            notify_type: notify_type,
            room_id: new_room_id,
            map_index: roomData.mapIndex,
            betType: roomData.betType,
            loadout: player_loadout,
            target_ids: notify_players,
            winner_id: roomData.prev_round_winner,
            round_id: roomData.prev_round_id,
            fightStruct: fightStruct,
            hasFightStruct: fightStruct != null,
            rounds: roomData.round_nr,
        } as RoomNotificationData
    };
    const options = { upsert: true };
    await db.collection("notifications").updateOne(filter, update, options);
}

export async function deleteNotification(notify_type: RoomNotificationType, roomData: RoomData): Promise<void> {
    const db = await getChainTeamTacticsDb();
    const filter = {
        notify_type: notify_type,
        room_id: roomData.account_id,
    };
    await db.collection("notifications").deleteOne(filter);
}

export async function getRoomNotification(account_id: string): Promise<RoomNotificationData> {
    const db = await getChainTeamTacticsDb();
    const notification = await db.collection("notifications").findOne<RoomNotificationData>(
        { target_ids: account_id },
        { projection: { _id: 0 } }
    );
    return notification;
}

export async function getAllNotifications(account_id: string): Promise<RoomNotificationData[]> {
    const db = await getChainTeamTacticsDb();

    // check for all inactive rooms the player are into
    // so this will create a ClosedRoom notification
    const allInactiveRooms = await getAllInactiveRooms(account_id);

    for (let i: number = 0; i < allInactiveRooms.length; i++) {
        const current = allInactiveRooms[i];

        // 1- refund both players
        // 2- create a ClosedRoom notification for both players
        // 3- delete the room
        if (!await deleteRoomAndRefundPlayers(account_id, current)) {
            break;
        }
    }

    // and then we grab all notifications that targets the player
    const allNotifications = await db.collection("notifications").find<RoomNotificationData>(
        { target_ids: account_id },
        { projection: { _id: 0 } }
    ).toArray();

    // FightFinish and ClosedRoom notifications are "self-destructive"
    for (let i: number = 0; i < allNotifications.length; i++) {
        const current = allNotifications[i];

        if (current.notify_type == RoomNotificationType.FightFinish ||
            current.notify_type == RoomNotificationType.ClosedRoom) {

            if (current.target_ids.length != 2) {
                // once there's only one player left
                // notification should be deleted
                await db.collection("notifications").deleteOne({ room_id: current.room_id });
            }
            else {
                // if there's still both player names on it
                // remove current player and save
                const index = current.target_ids.indexOf(account_id);
                current.target_ids.splice(index, 1);
                await db.collection("notifications").updateOne(
                    { room_id: current.room_id },
                    { $set: current }
                );
            }

            // for the player who played the round that finished the fight
            // we remove the fightStruct so they won't have to rewatch it
            if (current.notify_type == RoomNotificationType.FightFinish &&
                current.round_id == account_id) {
                current.hasFightStruct = false;
                current.fightStruct = null;
            }

            // remove the anti-conflict suffix
            const lastDotIndex = current.room_id.lastIndexOf(".");
            const cleanRoomId = current.room_id.substring(0, lastDotIndex);
            current.room_id = cleanRoomId;
        }
    }
    return allNotifications;
}

export async function deleteRoomAndFinishFight(roomData: RoomData, winnerIndex: number, loserIndex: number, fromSimulate: boolean, res: NextApiResponse<any>): Promise<boolean> {
    // set winner/loser names for the notifications
    roomData.prev_round_winner = roomData.playerNames[winnerIndex];
    roomData.prev_round_loser = roomData.playerNames[loserIndex];

    // grab both players account data
    const winnerAccountData = await getAccountData(roomData.prev_round_winner);
    const winnerPlayerData = winnerAccountData.playerdata;

    const loserAccountData = await getAccountData(roomData.prev_round_loser);
    const loserPlayerData = loserAccountData.playerdata;

    // update players rank with most recent value
    // because players can be into multiple rooms
    // and this might mess up with rank changes
    roomData.playerRanks[winnerIndex] = winnerPlayerData.rating;
    roomData.playerRanks[loserIndex] = loserPlayerData.rating;

    // TODO: change this later with some fancy rank calculations
    const prev_winner_rating = roomData.playerRanks[winnerIndex];
    roomData.playerRanks[winnerIndex] =
        Math.min(roomData.playerRanks[winnerIndex] + 10, 0xFFFF);

    const prev_loser_rating = roomData.playerRanks[loserIndex];
    roomData.playerRanks[loserIndex] =
        Math.max(roomData.playerRanks[loserIndex] - 10, 400);

    const contract_args = {
        winner_id: roomData.prev_round_winner,
        winner_rating_change: roomData.playerRanks[winnerIndex] - prev_winner_rating,
        loser_id: roomData.prev_round_loser,
        loser_rating_change: roomData.playerRanks[loserIndex] - prev_loser_rating,
        bet_type: roomData.betType,
    };

    //#TODO enable after beta
    // const response = await changeFunctionWithoutAttachment(
    //     MANAGER_ACCOUNT,
    //     MANAGER_KEY,
    //     APP_CONTRACT,
    //     "ctt_save_fight_result",
    //     { result: contract_args },
    //     new BN('20000000000000')// 20
    // );

    // if (!checkFunctionResponse(response)) {
    //     res.status(200).json({ success: false, error: response.error.type });
    //     return false;
    // }

    if (fromSimulate) {
        await updateLeaderboard(roomData.prev_round_winner, [winnerPlayerData.matches_won + 1, winnerPlayerData.matches_lost], roomData);
        await updateLeaderboard(roomData.prev_round_loser, [loserPlayerData.matches_won, loserPlayerData.matches_lost + 1], roomData);
    }

    await deleteRoom(roomData);
    return true;
}

async function deleteRoomAndRefundPlayers(account_id: string, roomData: RoomData): Promise<boolean> {
    //#TODO enable after beta
    // const response = await changeFunctionWithoutAttachment(
    //     MANAGER_ACCOUNT,
    //     MANAGER_KEY,
    //     APP_CONTRACT,
    //     "ctt_refund_room_players",
    //     {
    //         account_ids: roomData.playerNames,
    //         bet_type: roomData.betType
    //     },
    //     new BN('30000000000000')// 30
    // );

    // if (!checkFunctionResponse(response)) {
    //     await logChainTeamTacticsErrorDb(response.error.type, account_id, "deleteRoomAndRefundPlayers");
    //     return false;
    // }

    await createOrUpdateRoomNotification(RoomNotificationType.ClosedRoom, roomData);
    await deleteRoom(roomData);
    return true;
}