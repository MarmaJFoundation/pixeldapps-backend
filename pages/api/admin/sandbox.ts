import type { NextApiRequest, NextApiResponse } from 'next'
import { BattleController } from '../../../utils/backend/chainteamtactics/battle/core';
import { MapType, UnitInfo, UnitType } from '../../../utils/backend/chainteamtactics/battle/types';
import { getMapBaseData, getPlayerData, getUnitBaseData } from '../../../utils/backend/chainteamtactics/helper/basic_game';
import { EndCreateRoomRequest } from '../../../utils/backend/chainteamtactics/helper/types';
import { getAllJoinedRooms, getUnitByType } from '../../../utils/backend/chainteamtactics/helper/utils';
import { getPixelPetsDb } from '../../../utils/backend/common/mongo-helper';
import { getPgClient } from '../../../utils/backend/common/pgdb';
import { is_valid_request, setup_headers } from '../../../utils/backend/common/rq_utils';
import { FunctionRequest } from '../../../utils/backend/common/types';
import { getCurrentWeekCode, getNextWeekCode, getPreviousWeekCode, Vector2 } from '../../../utils/backend/common/utils';
import { ClassType } from '../../../utils/backend/cryptohero/dungeon/types';
import { getLeaderboard, getRaidscores } from '../../../utils/backend/cryptohero/helper/basic_game';
import { get_items_by_ids } from '../../../utils/backend/cryptohero/helper/data_loader';
import { ItemToken } from '../../../utils/backend/cryptohero/helper/types';
// import { _hotfix_LeaderboardWeekCode2022 } from '../../../utils/backend/pixelpets/helper/basic_game';

/*
 * endpoint created for fast testing new stuff
 */

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    return res.status(404).json({ error: "404 - Not Found" });
    // setup_headers(req, res);
    // const rq: FunctionRequest = req.body;

    // if (!is_valid_request([rq.account_id], res)) {
    //     return;
    // }

    // const max_results = 30;

    // try {
    //     // const mage = await getLeaderboard(ClassType.Mage, max_results);
    //     // const knight = await getLeaderboard(ClassType.Knight, max_results);
    //     // const ranger = await getLeaderboard(ClassType.Ranger, max_results);
    //     // res.status(200).json({ success: true, data: { mage: mage, knight: knight, ranger: ranger } });

    //     // const x = await getRaidscores(0);
    //     // console.log(x);

    //     // const currentWeek = getCurrentWeekCode();
    //     // const prevWeek = getPreviousWeekCode();
    //     // const nextWeek = getNextWeekCode();

    //     // console.log({ previous: prevWeek, current: currentWeek, next: nextWeek });
    //     // await _hotfix_LeaderboardWeekCode2022("W52Y2022");

    //     res.status(200).json({ success: true });
    // }
    // catch (err) {
    //     console.log(err);
    //     res.status(200).json({ success: false, error: err });
    // }

    // --------------------------------------------------------------------------------

    // try {
    //     let data: any = "";
    //     const client = getPgClient();

    //     await client.connect();
    //     try {
    //         const excluded_ids: string[] = [];

    //         data = await client.query(`
    //             SELECT 
    //                 ara.args->'args_json'->'token_id' as token_id,
    //                 ara.args->'args_json'->'owner' as owner,
    //                 ara.args->'args_json'->'buyer' as buyer,
    //                 ara.args->'args_json'->'price' as price
    //             FROM
    //                 action_receipt_actions ara
    //             INNER JOIN
    //                 execution_outcomes eo ON ara.receipt_id = eo.receipt_id
    //             WHERE
    //                 ara.action_kind = 'FUNCTION_CALL' AND
    //                 ara.args->'args_json'->>'owner' = $1 AND
    //                 ara.args->'args_json'->>'token_id' != ALL($2) AND
    //                 ara.args->>'method_name' = 'ch_buy_item' AND
    //                 ara.receipt_receiver_account_id = 'pixeltoken.near' AND
    //                 eo.status = 'SUCCESS_VALUE'
    //             ORDER BY
    //                 eo.executed_in_block_timestamp ASC
    //             LIMIT 100
    //         `, [rq.account_id, excluded_ids]);
    //     }
    //     catch (ierr) {
    //         throw ierr;
    //     }
    //     finally {
    //         await client.end();
    //     }

    //     const history: MarketHistory[] = data.rows;
    //     const token_ids: string[] = history.map(x => x.token_id);
    //     let count = 0;

    //     console.log(`fetching ${token_ids.length} item(s): ${token_ids}`);

    //     for (let i: number = 0; i < token_ids.length; i++) {
    //         try {
    //             history[i].item_token = (await get_items_by_ids([token_ids[i]]))[0];
    //             count++;
    //         }
    //         catch (ex) {
    //             // console.log(ex);
    //         }
    //     }

    //     console.log(`existing item(s): ${count}/${token_ids.length}`);

    //     res.status(200).json({ success: true, data: history });
    // }
    // catch (err) {
    //     console.log(err);
    //     res.status(200).json({ success: false, error: err });
    // }

    // try {
    //     await getMapBaseData();
    //     await getUnitBaseData();

    // const pdata = await getPlayerData(
    //     {
    //         account_id: "bubruno.testnet",
    //         player_loadout: [{
    //             token_id: "0",
    //             position: { x: 18, y: 2 },
    //         }, {
    //             token_id: "1",
    //             position: { x: 18, y: 3 },
    //         }, {
    //             token_id: "2",
    //             position: { x: 18, y: 4 },
    //         }, {
    //             token_id: "3",
    //             position: { x: 18, y: 5 },
    //         }, {
    //             token_id: "4",
    //             position: { x: 19, y: 5 },
    //         }, {
    //             token_id: "5",
    //             position: { x: 15, y: 3 },
    //         }]
    //     } as EndCreateRoomRequest,
    //     2);

    // console.log(JSON.stringify(pdata, null, 4));

    //     const purpleTeam: UnitInfo[] = [];
    //     const yellowTeam: UnitInfo[] = [];

    //     const purpleSpawn: Vector2[] = [
    //         { x: 18, y: 4 }, { x: 21, y: 4 }, { x: 27, y: 10 },
    //         { x: 19, y: 1 }, { x: 15, y: 11 }, { x: 17, y: 2 }
    //     ];

    //     const yellowSpawn: Vector2[] = [
    //         { x: 6, y: 9 }, { x: 13, y: 11 }, { x: 3, y: 0 },
    //         { x: 12, y: 0 }, { x: 8, y: 9 }, { x: 8, y: 2 }
    //     ];

    //     const yellowIds: number[] = [
    //         755918, 770647, 146676,
    //         436693, 498712, 279046
    //     ];

    //     const purpleIds: number[] = [
    //         286357, 732358, 890317,
    //         187400, 187982, 509016
    //     ]

    //     const purpleTeamUnits: UnitType[] = [
    //         UnitType.Squire, UnitType.Marksman, UnitType.Druid,
    //         UnitType.Marksman, UnitType.Mage, UnitType.Knight
    //     ];

    //     const yellowTeamUnits: UnitType[] = [
    //         UnitType.Executioner, UnitType.Squire, UnitType.Knight,
    //         UnitType.Druid, UnitType.Bard, UnitType.Priest
    //     ];

    //     for (let i: number = 0; i < 6; i++) {
    //         const utype = purpleTeamUnits[i];
    //         const udata = getUnitByType(utype);

    //         purpleTeam.push({
    //             unitID: purpleIds[i],
    //             unitType: utype,
    //             speed: udata.speed,
    //             damage: udata.damage,
    //             health: udata.health,
    //         } as UnitInfo);
    //     }

    //     for (let i: number = 0; i < 6; i++) {
    //         const utype = yellowTeamUnits[i];
    //         const udata = getUnitByType(utype);

    //         yellowTeam.push({
    //             unitID: yellowIds[i],
    //             unitType: utype,
    //             speed: udata.speed,
    //             damage: udata.damage,
    //             health: udata.health,
    //         } as UnitInfo);
    //     }

    //     const battle: BattleController = new BattleController();
    //     const results = battle.GenerateFightStruct(MapType.Temple, purpleTeam, purpleSpawn, yellowTeam, yellowSpawn);

    //     // const actionStructSerializer = new ActionStructSerializer();
    //     // const actionStructData = actionStructSerializer.serialize(results.actionStructs);

    //     // results.actionStructs = encodeBase64(actionStructData) as any;
    //     // // results["b64ActionStructData"] = encodeBase64(actionStructData);

    //     res.status(200).json({ success: true, data: results });
    // }
    // catch (err) {
    //     console.log(err);
    //     res.status(200).json({ success: false, error: err });
    // }
}

// export type MarketHistory = {
//     // receipt_id: string;
//     token_id: string;
//     owner: string;
//     buyer: string;
//     price: string;
//     item_token: ItemToken;
// }