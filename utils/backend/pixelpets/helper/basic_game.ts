import { viewFunction, APP_CONTRACT, changeFunctionWithoutAttachment, MANAGER_ACCOUNT, MANAGER_KEY, checkFunctionResponse } from "../../common/blockchain";
import { FightRequest, LockType, PlayerData, PlayerLoadoutData, PlayerTournamentData } from './types'
import { createBotData, LoadoutSize } from "../fight/utils";
import { PetType } from "./types"
import { scaled_pets_by_ids } from "./pet_scaling";
import { getPixelPetsDb, isLockTaken } from "../../common/mongo-helper";
import { assert, clamp, getCurrentWeekCode, shuffle } from "../../common/utils";
import { NextApiResponse } from "next";

export let CACHED_PETBASE_DATA: PetType[] = [];// Note: CreaturesMap was removed so now CACHED_PETBASE_DATA are constantly requested during fightings
export let CACHED_PETBASE_DATA_TIMESTAMP: number = 0;
export const STARTER_PET_IDS: number[] = [57, 58, 59];

export async function getPetBaseData(): Promise<PetType[]> {
    const elapsedTimeSinceLastCache = clamp(Math.round((Date.now() - CACHED_PETBASE_DATA_TIMESTAMP) / 1000), 0, Infinity);
    if (CACHED_PETBASE_DATA_TIMESTAMP != 0 &&
        elapsedTimeSinceLastCache < 30) {
        return CACHED_PETBASE_DATA;
    }
    const db = await getPixelPetsDb();
    const pets = await db.collection<PetType>("pets").find({}, { projection: { _id: 0 } }).toArray();
    CACHED_PETBASE_DATA_TIMESTAMP = Date.now();
    CACHED_PETBASE_DATA = pets;
    return pets;
}

export async function getAccountData(account_id: string) {
    return await viewFunction(APP_CONTRACT, "get_player_data", { account_id });
}

export async function getPlayerTeam(rq: FightRequest): Promise<PlayerData> {
    const accountdata = await getAccountData(rq.account_id);
    const playerdata = accountdata.playerdata;
    if (playerdata["fight_balance"] == 0) {
        throw "your fight balance is too low";
    }
    const pet_ids = playerdata.pet_ids as string[];

    if (rq.playerdata.pet_loadout.length != LoadoutSize) {
        throw "Invalid amount of pets";
    }

    const duplicate_pet_ids = rq.playerdata.pet_loadout.filter((item, index) => rq.playerdata.pet_loadout.indexOf(item) != index);

    if (duplicate_pet_ids.length != 0) {
        throw "Duplicates not allowed";
    }

    rq.playerdata.pet_loadout.forEach(pet_id => {
        if (!pet_ids.includes(pet_id)) {
            throw "You don't own this pet";
        }
    });

    const scaled_pets = await scaled_pets_by_ids(rq.playerdata.pet_loadout);
    //todo - need to change this to a number (todo: divide state_timer by 1000 at contract output)
    scaled_pets.forEach(scaled_pet => {
        if (scaled_pet.state_timer > Date.now().toString()) {
            throw "Your pets are not ready";
        }
    });

    // casting accountdata.playerdata to PlayerData does not exclude
    // unnecessary fields like 'hatching' and 'train_timer'
    // and also PetToken does have unnecessary data for the loadout
    // so we better create them manually containing only necessary data
    const pdata: PlayerData = {
        account_id: rq.account_id,
        matches_won: playerdata.matches_won,
        matches_lost: playerdata.matches_lost,
        player_rating: playerdata.rating,
        player_loadout: rq.playerdata.pet_loadout.map<PlayerLoadoutData>(id => {
            const x = scaled_pets.find(x => x.token_id == id);
            return {
                token_id: x.token_id,
                pet_type: x.pet_type,
                pet_rarity: x.rarity,
                pet_level: x.level,
                pet_trainLevel: x.train_level,
                pet_power_level: x.power_level,
                pet_experience: x.xp,
            }
        }),
        last_fight: Date.now(),
    };

    return pdata;
}

// https://docs.mongodb.com/manual/reference/operator/query/#query-selectors
export async function getEnemyTeam_v0(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const enemies_data = await db.collection<PlayerData>("leaderboard").find({
        account_id: {// filter out the player itself who is looking for an enemy
            $ne: player_data.account_id,
        },
        player_rating: {// filter enemies by similar rating(eg. if player rating is 800, it'll look for enemies in between 600~1000)
            $gte: player_data.player_rating * .75,
            $lte: player_data.player_rating * 1.25,
        }
    })
    .project<PlayerData>({// exclude object id
        _id: 0,
    })
    .limit(50)
    .toArray();

    if (enemies_data.length > 1) {
        enemies_data.sort((a, b) => {// sort enemies from lowest to highest rating difference against the player
            const x = Math.abs(player_data.player_rating - a.player_rating);
            const y = Math.abs(player_data.player_rating - b.player_rating);
            return x - y;
        });
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];// return the enemy with the most similar rating
}

export async function getEnemyTeam_v1(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const enemies_data = await db.collection<PlayerData>("leaderboard").find({
        account_id: {// filter out the player itself who is looking for an enemy
            $ne: player_data.account_id,
        },
        player_rating: {// filter enemies by similar rating(eg. if player rating is 800, it'll look for enemies in between 700~900)
            $gte: player_data.player_rating - 100,
            $lte: player_data.player_rating + 100,
        }
    })
    .project<PlayerData>({// exclude object id
        _id: 0,
    })
    .limit(50)
    .toArray();

    if (enemies_data.length > 1) {
        shuffle(enemies_data);
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];
}

export async function getEnemyTeam_v2(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const pp_avg = player_data.player_loadout.map(x => x.pet_level).reduce((sum, curr) => sum + curr) / LoadoutSize
    const enemies_data = await db.collection<PlayerData>("leaderboard").aggregate<PlayerData>([
        {
            $project: {
                _id: 0,
                account_id: 1,
                matches_lost: 1,
                matches_won: 1,
                player_loadout: 1,
                player_rating: 1,
                pets_level_avg: {
                    $avg: ["$player_loadout.pet_level"]
                },
                result: {
                    $not: [
                        { $eq: ["$account_id", player_data.account_id] },
                    ]
                }
            }
        },
        {
            $match: {
                $and: [
                    { "player_rating": { $gte: player_data.player_rating - 150 } },
                    { "player_rating": { $lte: player_data.player_rating + 150 } },
                ]
            }
        },
        {
            $match: {
                $and: [
                    { "pets_level_avg": { $gte: pp_avg * 0.78 } },
                    { "pets_level_avg": { $lte: pp_avg * 1.22 } },
                ]
            }
        },
        {
            $limit: 50
        }
    ])
    .toArray()
    .then(x => x.filter(x => x["result"]));

    // enemies_data["pp_lv_avg"] = pp_avg;
    // console.log(enemies_data);

    if (enemies_data.length > 1) {
        shuffle(enemies_data);
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];
}

export async function getEnemyTeam_v3(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const baseRating = (player_data.player_rating * 20) - 3000;
    const petsLevel = ((player_data.player_loadout.map(x => x.pet_level).reduce((sum, curr) => sum + curr) - 50) * 120) - 1500;
    const petsTrainLevel = ((player_data.player_loadout.map(x => x.pet_trainLevel).reduce((sum, curr) => sum + curr) - 3) * 120) - 250;
    const petsPowerLevel = ((player_data.player_loadout.map(x => x.pet_power_level).reduce((sum, curr) => sum + curr) - 200) * 150) - 1500;
    const petsRarity = (player_data.player_loadout.map(x => x.pet_rarity).reduce((sum, curr) => sum + curr) * 800) - 250;
    const modRating = clamp(800 + (baseRating + petsLevel + petsTrainLevel + petsPowerLevel + petsRarity) / 50, 800, 3000);
    const enemies_data = await db.collection<PlayerData>("leaderboard").aggregate<PlayerData>([
        {
            $project: {
                _id: 0,
                account_id: 1,
                matches_lost: 1,
                matches_won: 1,
                player_loadout: 1,
                player_rating: 1,
                result: {
                    $not: [
                        { $eq: ["$account_id", player_data.account_id] },
                    ]
                }
            }
        },
        {
            $match: {
                $and: [
                    { "player_rating": { $gte: modRating - 150 } },
                    { "player_rating": { $lte: modRating + 150 } },
                ]
            }
        },
        {
            $limit: 50
        }
    ])
    .toArray()
    .then(x => x.filter(x => x["result"]));

    // enemies_data["yourELO"] = player_data.player_rating;
    // enemies_data["baseELO"] = baseRating;
    // enemies_data["petsLVL"] = petsLevel;
    // enemies_data["petsTLVL"] = petsTrainLevel;
    // enemies_data["petsPLVL"] = petsPowerLevel;
    // enemies_data["petsRTY"] = petsRarity;
    // enemies_data["modELO"] = modRating;
    // console.log(enemies_data);

    if (enemies_data.length > 1) {
        shuffle(enemies_data);
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];
}

export async function getEnemyTeam_v4(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const baseRating = (player_data.player_rating * 20) - 3000;
    const petsLevel = ((player_data.player_loadout.map(x => x.pet_level).reduce((sum, curr) => sum + curr) - 50) * 120) - 1500;
    const petsTrainLevel = ((player_data.player_loadout.map(x => x.pet_trainLevel).reduce((sum, curr) => sum + curr) - 3) * 120) - 250;
    const petsPowerLevel = ((player_data.player_loadout.map(x => x.pet_power_level).reduce((sum, curr) => sum + curr) - 200) * 150) - 1500;
    const petsRarity = (player_data.player_loadout.map(x => x.pet_rarity).reduce((sum, curr) => sum + curr) * 800) - 250;
    const modRating = clamp(800 + (baseRating + petsLevel + petsTrainLevel + petsPowerLevel + petsRarity) / 50, 800, 10000);
    const percentage = clamp(Math.round(modRating * modRating * .00005), 150, 5000);
    const enemies_data = await db.collection<PlayerData>("leaderboard").aggregate<PlayerData>([
        {
            $project: {
                _id: 0,
                account_id: 1,
                matches_lost: 1,
                matches_won: 1,
                player_loadout: 1,
                player_rating: 1,
                result: {
                    $not: [
                        { $eq: ["$account_id", player_data.account_id] },
                    ]
                }
            }
        },
        {
            $match: {
                $and: [
                    { "player_rating": { $gte: modRating - percentage } },
                    { "player_rating": { $lte: modRating + percentage } },
                ]
            }
        },
        {
            $limit: 50
        }
    ])
    .toArray()
    .then(x => x.filter(x => x["result"]));

    // enemies_data["yourELO"] = player_data.player_rating;
    // enemies_data["baseELO"] = baseRating;
    // enemies_data["petsLVL"] = petsLevel;
    // enemies_data["petsTLVL"] = petsTrainLevel;
    // enemies_data["petsPLVL"] = petsPowerLevel;
    // enemies_data["petsRTY"] = petsRarity;
    // enemies_data["modELO"] = modRating;
    // console.log(enemies_data);

    if (enemies_data.length > 1) {
        shuffle(enemies_data);
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];
}

export async function getEnemyTeam_v5(player_data: PlayerData): Promise<PlayerData> {
    const db = await getPixelPetsDb();
    const baseRating = (player_data.player_rating * 25) - 3500;
    const petsLevel = ((player_data.player_loadout.map(x => x.pet_level).reduce((sum, curr) => sum + curr) - 50) * 100) - 1500;
    const petsTrainLevel = ((player_data.player_loadout.map(x => x.pet_trainLevel).reduce((sum, curr) => sum + curr) - 3) * 100) - 250;
    const petsPowerLevel = ((player_data.player_loadout.map(x => x.pet_power_level).reduce((sum, curr) => sum + curr) - 200) * 100) - 1500;
    const petsRarity = (player_data.player_loadout.map(x => x.pet_rarity).reduce((sum, curr) => sum + curr) * 700) - 250;
    const modRating = clamp(800 + (baseRating + petsLevel + petsTrainLevel + petsPowerLevel + petsRarity) / 50, 800, 20000);
    const percentage = clamp(Math.round(player_data.player_rating * player_data.player_rating * .00005), 150, 10000);
    const divider = clamp(percentage * .003, 1, 20);
    const enemies_data = await db.collection<PlayerData>("leaderboard").aggregate<PlayerData>([
        {
            $project: {
                _id: 0,
                account_id: 1,
                matches_lost: 1,
                matches_won: 1,
                player_loadout: 1,
                player_rating: 1,
                result: {
                    $not: [
                        { $eq: ["$account_id", player_data.account_id] },
                    ]
                }
            }
        },
        {
            $match: {
                $and: [
                    { "player_rating": { $gte: modRating - percentage / divider } },
                    { "player_rating": { $lte: modRating + percentage } },
                ]
            }
        },
        {
            $limit: 50
        }
    ])
    .toArray()
    .then(x => x.filter(x => x["result"]));

    // enemies_data["yourELO"] = player_data.player_rating;
    // enemies_data["baseELO"] = baseRating;
    // enemies_data["petsLVL"] = petsLevel;
    // enemies_data["petsTLVL"] = petsTrainLevel;
    // enemies_data["petsPLVL"] = petsPowerLevel;
    // enemies_data["petsRTY"] = petsRarity;
    // enemies_data["modELO"] = modRating;
    // console.log(enemies_data);

    if (enemies_data.length > 1) {
        shuffle(enemies_data);
    }
    else if (enemies_data.length == 0) {
        enemies_data.push(createBotData(player_data));
    }

    return enemies_data[0];
}

export async function updateLeaderboard(player_data: PlayerData, won: boolean) {
    //todo calc points based on lvl + won bool | maybe put this logic on 'fight/core/updatePlayerAfterBattle' ?
    const options = { upsert: true };
    const db = await getPixelPetsDb();
    const marketplace = await db.collection("leaderboard").updateOne(
        { account_id: player_data.account_id },
        { $set: player_data },
        options);

    /*
     * tournament stuff
     */

    const w_code = getCurrentWeekCode();
    let w_entry = await db.collection("tournament").findOne<PlayerTournamentData>({
        account_id: player_data.account_id,
        week_code: w_code,
    });

    if (w_entry) {
        if (won) {
            w_entry.matches_won++;
        } else {
            w_entry.matches_lost++;
        }
        w_entry.player_loadout = player_data.player_loadout;
        w_entry.last_fight = player_data.last_fight;
    } else {
        w_entry = {
            account_id: player_data.account_id,
            week_code: w_code,
            matches_won: won ? 1 : 0,
            matches_lost: !won ? 1 : 0,
            player_loadout: player_data.player_loadout,
            last_fight: player_data.last_fight,
            created_at: new Date(),
        }
    }

    await db.collection("tournament").updateOne(
        { account_id: w_entry.account_id, week_code: w_entry.week_code },
        { $set: w_entry },
        options);
}

export async function getLeaderboard(results: number = 100): Promise<any[]> {
    const db = await getPixelPetsDb();
    const entries = await db.collection("leaderboard").find({})
    .sort({
        player_rating: -1,
    })
    .project({
        _id: 0,
        last_fight: 0,
        player_loadout: {
            pet_level: 0,
            pet_trainLevel: 0,
            pet_power_level: 0,
            pet_experience: 0,
        }
    })
    .limit(results)
    .toArray();
    return entries;
}

export async function getTournament(week_code: string, results: number = 50): Promise<any[]> {
    const db = await getPixelPetsDb();
    const entries = await db.collection("tournament").aggregate([
        {
            $match: {
                week_code: week_code
            }
        },
        {
            $project: {
                _id: 0,
                account_id: 1,
                matches_lost: 1,
                matches_won: 1,
                player_loadout: 1,
                score: {
                    $subtract: ["$matches_won", "$matches_lost"]
                }
            }
        },
        {
            $sort: {
                score: -1
            }
        },
        {
            $limit: results
        }
    ])
    .toArray();
    return entries;
}

export async function getInactivePlayers(base_rating: number = 1700, days_count: number = 1): Promise<any[]> {
    const db = await getPixelPetsDb();
    const entries = await db.collection("leaderboard").aggregate([
        {
            $project: {
                _id: 0,
                account_id: 1,
                player_rating: 1,
                last_fight: 1,
                elapsed_days: {
                    $round: [{
                        $divide: [{
                            $subtract: [new Date().getTime(), "$last_fight"]
                        }, 86400000]
                    }, 0]
                }
            }
        },
        {
            $match: {
                $and: [
                    { "player_rating": { $gte: base_rating } },
                    { "elapsed_days": { $gte: days_count } },
                ]
            }
        },
        {
            $sort: {
                player_rating: -1,
            }
        }
    ])
    .toArray();
    return entries;
}

export async function isRatingDecayAllowed(): Promise<boolean> {
    const kvp = {
        key: "next_check",
        value: 86400000,
    };
    const options = { upsert: true };
    const db = await getPixelPetsDb();
    const result = await db.collection("rating_decay").findOne<{ key: string, value: number }>({ key: kvp.key });
    const timeNow = new Date().getTime();

    if (!result || timeNow >= result.value) {
        const nextCheck = timeNow + kvp.value;

        await db.collection("rating_decay").updateOne(
            { key: kvp.key },
            { $set: { key: kvp.key, value: nextCheck } },
            options);

        return true;
    }

    return false;
}

export async function checkDecreaseRating(account_id: string | null, accountdata: any | null, res: NextApiResponse<any>): Promise<boolean> {
    assert(account_id, "'account_id' is missing");
    if (!accountdata) {
        accountdata = await getAccountData(account_id);
    }
    const db = await getPixelPetsDb();
    const playerentry = await db.collection("leaderboard").findOne(
        { account_id: account_id },
        {
            projection: {
                _id: 0,
                player_rating: 1,
                last_fight: 1,
                elapsed_days: {
                    $round: [{
                        $divide: [{
                            $subtract: [new Date().getTime(), "$last_fight"]
                        }, 86400000]
                    }, 0]
                }
            }
        });

    if (playerentry) {
        const playerdata = accountdata.playerdata;
        if (playerentry.player_rating < playerdata.rating) {
            playerdata.rating = playerentry.player_rating;
            const response = await changeFunctionWithoutAttachment(
                MANAGER_ACCOUNT,
                MANAGER_KEY,
                APP_CONTRACT,
                "set_player_rating",
                {
                    account_id: account_id,
                    new_rating: playerdata.rating
                });

            if (!checkFunctionResponse(response)) {
                res.status(200).json({ success: false, error: response.error.type });
                return false;
            }
        }
        playerdata["last_fight"] = playerentry.last_fight;
        playerdata["elapsed_days"] = playerentry.elapsed_days;
    }

    return true;
}

// account locking

export async function lockAccount(account_id: string, lock_type: LockType): Promise<boolean> {
    const db = await getPixelPetsDb();
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
    const db = await getPixelPetsDb();
    const filter = {
        account_id: account_id,
        lock_type: lock_type,
    };
    await db.collection("account_lock").deleteOne(filter);
}

// ---

// export async function _hotfix_LeaderboardWeekCode2022(invalid_week_code: string) {
//     const currentWeekCode = getCurrentWeekCode();
//     const db = await getPixelPetsDb();
//     const options = { upsert: true };
//     const readonly = true;

//     // find all players with the invalid week_code
//     const invalid_entries = await db.collection("tournament")
//         .find({
//             week_code: invalid_week_code
//         }).toArray<PlayerTournamentData>();

//     // find all players with the valid week_code
//     // and filters only those who also have invalid entries
//     const valid_entries = await db.collection("tournament")
//         .find({
//             week_code: currentWeekCode
//         }).toArray<PlayerTournamentData>().then(x => {
//             const account_ids = invalid_entries.map(x => x.account_id);
//             return x.filter(y => account_ids.includes(y.account_id));
//         });

//     // these players does have entries on both invalid and valid week_codes
//     // update their scores within the valid one
//     for (let i: number = 0; i < valid_entries.length; i++) {
//         const entry = valid_entries[i];

//         const x = invalid_entries.find(x => x.account_id == entry.account_id);
//         const [entry_won, entry_lost] = [entry.matches_won, entry.matches_lost];
//         const [x_won, x_lost] = [x.matches_won, x.matches_lost];

//         entry.matches_won += x.matches_won;
//         entry.matches_lost += x.matches_lost;

//         if (!readonly) {
//             await db.collection("tournament").updateOne(
//                 { account_id: entry.account_id, week_code: currentWeekCode },
//                 {
//                     $set: {
//                         "matches_won": entry.matches_won,
//                         "matches_lost": entry.matches_lost,
//                     }
//                 },
//                 options);
//         }

//         console.log(`[${entry.account_id}] from ${entry_won}/${entry_lost} to ${entry.matches_won}/${entry.matches_lost} (${x_won}/${x_lost})`);
//     }

//     // these players does only have entries with invalid week_code
//     // just update their week_codes to the valid one
//     for (let i: number = 0; i < invalid_entries.length; i++) {
//         const entry = invalid_entries[i];
//         const x = valid_entries.find(x => x.account_id == entry.account_id);

//         // {"account_id": "toolipse.near", "week_code":"W52Y2022"}
//         // {"account_id": "cg771106051.near", "week_code":"W52Y2022"}
//         if (!x) {
//             if (!readonly) {
//                 await db.collection("tournament").updateOne(
//                     { account_id: entry.account_id, week_code: invalid_week_code },
//                     { $set: { "week_code": currentWeekCode } },
//                     options);
//             }
//             console.log(`[${entry.account_id}] not found`);
//         }
//     }

//     console.log(`invalid: ${invalid_entries.length}, valid: ${valid_entries.length}`);

//     // delete all invalid entries
//     if (!readonly) {
//         const x = await db.collection("tournament").deleteMany({ week_code: invalid_week_code });
//         console.log(`deleted: ${x.deletedCount}`);
//     }

//     /*
//     [baileybeck.near] from 89/52 to 99/59 (10/7)
//     [otismaeve.near] from 79/46 to 82/54 (3/8)
//     [hieutran.near] from 198/43 to 226/47 (28/4)
//     [leolizzie.near] from 75/47 to 84/53 (9/6)
//     [tedmosby.near] from 56/27 to 65/32 (9/5)
//     [doctoroctopus.near] from 134/48 to 142/51 (8/3)
//     [degengamer.near] from 76/55 to 91/63 (15/8)
//     [tanapat.near] from 59/3 to 68/4 (9/1)
//     [gordonfreeman.near] from 107/40 to 125/46 (18/6)
//     [miuhiu.near] from 62/30 to 65/35 (3/5)
//     [dogsheng.near] from 11/9 to 12/12 (1/3)
//     [kaadsgasd.near] from 40/16 to 45/21 (5/5)
//     [giaphongvks.near] from 63/7 to 73/7 (10/0)
//     [nergu.near] from 86/42 to 106/52 (20/10)
//     [pro100kill02.near] from 42/21 to 51/24 (9/3)
//     [quynhanh1.near] from 41/17 to 47/21 (6/4)
//     [huanghai.near] from 243/37 to 282/45 (39/8)
//     [brabrabooo.near] from 33/22 to 41/25 (8/3)
//     [imalways.near] from 76/80 to 87/89 (11/9)
//     [luziax.near] from 13/13 to 22/15 (9/2)
//     [marmaj.near] from 31/6 to 39/6 (8/0)
//     [lledbell.near] from 47/13 to 52/14 (5/1)
//     [idkai36.near] from 47/21 to 53/26 (6/5)
//     [namguyende.near] from 57/12 to 66/16 (9/4)
//     [thaolete.near] from 51/34 to 60/41 (9/7)
//     [gasan077.near] from 72/12 to 97/17 (25/5)
//     [tortum.near] from 54/8 to 61/10 (7/2)
//     [only-sleep.near] from 50/10 to 62/12 (12/2)
//     [eason9527.near] from 1/3 to 3/4 (2/1)
//     [babyboo.near] from 25/32 to 25/33 (0/1)
//     [michelle_obama.near] from 61/23 to 61/25 (0/2)
//     [alabatrap.near] from 29/6 to 29/7 (0/1)
//     [showme355.near] from 58/11 to 63/13 (5/2)
//     [hiumiu.near] from 83/25 to 89/31 (6/6)
//     [nequyenhvdttc8503.near] from 16/33 to 23/40 (7/7)
//     [spitbitz.near] from 41/6 to 45/6 (4/0)
//     [gtje0828.near] from 237/38 to 262/41 (25/3)
//     [hmtri1011.near] from 55/9 to 59/12 (4/3)
//     [lulukuang.near] from 108/9 to 143/12 (35/3)
//     [abgfr.near] from 27/22 to 32/24 (5/2)
//     [elonmusk_tesla.near] from 5/0 to 6/0 (1/0)
//     [marcel1111.near] from 26/7 to 40/8 (14/1)
//     [luckytype.near] from 60/7 to 67/10 (7/3)
//     [octaman.near] from 87/7 to 106/8 (19/1)
//     [profit.near] from 40/1 to 54/2 (14/1)
//     [ican3701.near] from 59/11 to 70/13 (11/2)
//     [chappie.near] from 21/3 to 22/3 (1/0)
//     [phamducvu3.near] from 47/61 to 62/72 (15/11)
//     [izosimov_mike.near] from 18/5 to 22/7 (4/2)
//     [susanoo.near] from 83/10 to 92/12 (9/2)
//     [chibakutensei.near] from 63/11 to 76/12 (13/1)
//     [izanagi.near] from 246/50 to 270/61 (24/11)
//     [izanami.near] from 194/67 to 220/75 (26/8)
//     [zanglee.near] from 46/7 to 65/7 (19/0)
//     [cryptogarik.near] from 22/3 to 23/4 (1/1)
//     [investor3000.near] from 3/5 to 4/9 (1/4)
//     [jayyoo.near] from 13/12 to 14/15 (1/3)
//     [robertstos.near] from 13/16 to 15/19 (2/3)
//     [pro100kill2.near] from 16/2 to 20/4 (4/2)
//     [ratatoeskr.near] from 3/9 to 5/9 (2/0)
//     [kangtheconqueror.near] from 73/17 to 78/18 (5/1)
//     [yourh.near] from 24/20 to 33/24 (9/4)
//     [mipu.near] from 122/15 to 131/17 (9/2)
//     [cronus.near] from 42/6 to 48/6 (6/0)
//     [mariemeza.near] from 115/15 to 125/16 (10/1)
//     [blaze.near] from 26/22 to 42/26 (16/4)
//     [ionelan.near] from 4/4 to 5/4 (1/0)
//     [coreman.near] from 7/5 to 16/7 (9/2)
//     [yiwan333.near] from 68/8 to 74/10 (6/2)
//     [nicolesuria.near] from 1/2 to 1/3 (0/1)
//     [stormg.near] from 1/1 to 2/1 (1/0)
//     [cbl336699.near] from 12/4 to 15/5 (3/1)
//     [mthaitrinh.near] from 9/4 to 10/4 (1/0)
//     [thetown.near] from 1/1 to 1/3 (0/2)
//     [toolipse.near] not found
//     [cg771106051.near] not found
//     invalid: 76, valid: 74
//     deleted: 74
//     */
// }