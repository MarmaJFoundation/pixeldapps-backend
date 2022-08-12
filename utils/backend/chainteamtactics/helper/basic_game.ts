import { APP_CONTRACT, viewFunction } from "../../common/blockchain";
import { getChainTeamTacticsDb, isLockTaken, logChainTeamTacticsErrorDb } from "../../common/mongo-helper";
import { assert, Vector2 } from "../../common/utils";
import { mapHeightOffset, mapWidthOffset } from "../battle/core";
import { MapData, TileType, UnitData, UnitType } from "../battle/types";
import { OutOfBounds } from "../battle/utils";
import { get_units_by_ids } from "./data_loader";
import { EndCreateRoomRequest, LockType, PlayerData, PlayerLoadoutData, RoomData, UnitScaledToken, UnitToken } from "./types";
import { getUnitByType, MaxUnitsPerAccount, MaxUnitsPerTeam } from "./utils";

export let CACHED_UNITBASE_DATA: UnitData[] = [];
export let CACHED_MAPBASE_DATA: MapData[] = [];

export async function getUnitBaseData(): Promise<UnitData[]> {
    if (CACHED_UNITBASE_DATA.length != 0) {
        return CACHED_UNITBASE_DATA;
    }
    const db = await getChainTeamTacticsDb();
    const units = await db.collection<UnitData>("units").find({}, { projection: { _id: 0 } }).toArray();
    CACHED_UNITBASE_DATA = units;
    return units;
}

export async function getMapBaseData(): Promise<MapData[]> {
    if (CACHED_MAPBASE_DATA.length != 0) {
        return CACHED_MAPBASE_DATA;
    }
    const db = await getChainTeamTacticsDb();
    const maps = await db.collection<MapData>("maps").find({}, { projection: { _id: 0 } }).toArray();
    CACHED_MAPBASE_DATA = maps;
    return maps;
}

export async function getAccountData(account_id: string) {
    const accountdata = await viewFunction(
        APP_CONTRACT,
        "ctt_get_player_data",
        { account_id }
    );

    const ranking = await getPlayerWithPosition(account_id);
    accountdata.playerdata.rating = ranking?.rank || 800;
    accountdata.playerdata.matches_lost = ranking?.lost || 0;
    accountdata.playerdata.matches_won = ranking?.won || 0;


    return accountdata;
}

export async function getPlayerData(rq: EndCreateRoomRequest, mapIndex: number, isPurple: boolean, ignore_maxunits: boolean = false, ignore_loadout: boolean = false): Promise<PlayerData> {
    const playerdata = (await getAccountData(rq.account_id)).playerdata;
    const unit_ids = playerdata.unit_ids as string[];
    let unitsdata: UnitScaledToken[] = [];

    // cache all base data
    const mapDatas = await getMapBaseData();
    const unitData = await getUnitBaseData();

    assert(ignore_maxunits || unit_ids.length < MaxUnitsPerAccount, `more than ${MaxUnitsPerAccount} units not supported`);
    assert(ignore_loadout || rq.player_loadout.length == MaxUnitsPerTeam, `you can't place other than ${MaxUnitsPerTeam} units`);

    if (rq.player_loadout.length != 0) {
        const token_ids = rq.player_loadout.map(x => x.token_id);
        const positions = rq.player_loadout.map(x => x.position);

        // check for duplicated unit token ids
        const duplicate_token_ids = token_ids.filter((token_id, index) => token_ids.indexOf(token_id) != index);
        assert(duplicate_token_ids.length == 0, "duplicated units not allowed");

        // check units ownership
        token_ids.forEach(token_id => {
            assert(unit_ids.includes(token_id), "you don't own this unit");
        });

        // fetch all UnitTokens from blockchain
        unitsdata = await get_units_by_ids(token_ids);

        // check for units being sold
        unitsdata.forEach(unit_token => {
            assert(!unit_token.price || unit_token.price == "0" , "you can't place units on sale");
        });

        // check support units count
        const maxSupportUnits = MaxUnitsPerTeam / 2;
        let supportUnits: number = 0;

        unitsdata.forEach(unit_token => {
            const unit_data = unitData.find(x => x.unit_type == unit_token.unit_type);
            if (unit_data.supports) {
                supportUnits++;
                assert(supportUnits <= maxSupportUnits, "too many support units");
            }
        });

        // check if all unit positions are in bounds
        // and if they are into the correct side of the map
        for (let i: number = 0; i < positions.length; i++) {
            const position = positions[i];
            assert(!OutOfBounds(position.x, position.y), `unit #${token_ids[i]} is out of bounds @ ${position.x}x${position.y}`);
            assert(!isPurple ? position.x <= mapWidthOffset : position.x >= mapWidthOffset, `unit #${token_ids[i]} were placed at the wrong side of the map`);
        }

        // check if all units can be placed in its positions
        const mapData = mapDatas[mapIndex];
        const unitTileInfos = mapData.tile_infos.filter(tileInfo => {
            const op = {
                x: tileInfo.position.x + mapWidthOffset,
                y: tileInfo.position.y + mapHeightOffset,
            } as Vector2;
            return positions.findIndex(cp => cp.x == op.x && cp.y == op.y) != -1;
        });

        for (let i: number = 0; i < unitTileInfos.length; i++) {
            const current_tile = unitTileInfos[i];
            const token_id = token_ids[i];

            if (current_tile.blocked || current_tile.tile_type == TileType.Lava) {
                assert(!current_tile.blocked, `unit #${token_id} can't be placed in blocked tile @ ${current_tile.position.x + mapWidthOffset}x${current_tile.position.y + mapHeightOffset}`);
                const udata = unitsdata.find(x => x.token_id == token_id);
                assert(udata.unit_type == UnitType.Warlock, `unit #${token_id} can't be placed in lava tile @ ${current_tile.position.x + mapWidthOffset}x${current_tile.position.y + mapHeightOffset}`);
            }
        }
    }

    const pdata: PlayerData = {
        account_id: rq.account_id,
        matches_won: playerdata.matches_won,
        matches_lost: playerdata.matches_lost,
        rating: playerdata.rating,
        player_loadout: rq.player_loadout.map<PlayerLoadoutData>(current => {
            const x = unitsdata.find(x => x.token_id == current.token_id);
            return {
                token_id: current.token_id,
                position: current.position,
                unit_type: x.unit_type,
                health: x.health,
                damage: x.damage,
                speed: x.speed,
            } as PlayerLoadoutData;
        })
    };

    return pdata;
}

// leaderboard

export async function updateLeaderboard(account_id: string, wonlost: number[], roomData: RoomData): Promise<void> {
    const db = await getChainTeamTacticsDb();
    const filter = {
        account_id: account_id,
    };
    const index = roomData.playerNames.indexOf(account_id);
    const update = {
        $set: {
            won: wonlost[0],
            lost: wonlost[1],
            rank: roomData.playerRanks[index],
            loadout: roomData.playerLoadouts[index].map(x => {
                const data = {
                    token_id: x.token_id,
                    unit_type: x.unit_type,
                };
                return data;
            }),
        }
    };
    const options = { upsert: true };
    await db.collection("leaderboard").updateOne(filter, update, options);
}

export async function getLeaderboard(results: number = 100): Promise<any[]> {
    const db = await getChainTeamTacticsDb();
    const entries = await db.collection("leaderboard").find({})
        .sort({
            rank: -1,
        })
        .project({
            _id: 0,
        })
        .limit(results)
        .toArray();
    return entries;
}

export async function getPlayerWithPosition(account_id: string): Promise<any> {
    const db = await getChainTeamTacticsDb();
    const playerData = await db.collection("leaderboard").findOne(
        { account_id: account_id },
        {
            projection: {
                _id: 0,
            }
        });

    if (playerData) {
        const index = await db.collection("leaderboard").find({})
            .sort({
                rank: -1,
            })
            .toArray()
            .then(x => x.findIndex(y => y.account_id == playerData.account_id));
        playerData["position"] = index + 1;
        return playerData;
    }

    return null;
}

// account locking

export async function lockAccount(account_id: string, lock_type: LockType): Promise<boolean> {
    const db = await getChainTeamTacticsDb();
    const filter = {
        account_id: account_id,
        lock_type: lock_type,
    };
    const update = {
        $set: {
            timestamp: new Date(),
        }
    };
    const options = { upsert: true };
    const result = await db.collection("account_lock").updateOne(filter, update, options);
    const lockTaken = isLockTaken(result);

    return lockTaken;
}

export async function unlockAccount(account_id: string, lock_type: LockType): Promise<void> {
    const db = await getChainTeamTacticsDb();
    const filter = {
        account_id: account_id,
        lock_type: lock_type,
    };
    await db.collection("account_lock").deleteOne(filter);
}