import clientPromise from "./mongodbv2";
import { is_testnet_env } from "./utils";

const pp_mongodb = process.env.PP_MONGO_DB || "pixelpets_testnet";
const ch_mongodb = process.env.CH_MONGO_DB || "cryptohero_testnet";
const ctt_mongodb = process.env.CTT_MONGO_DB || "chainteamtactics_testnet";

// ---------------

export async function logPixelPetsErrorDb(error: any, user: string, method: string) {
    if (is_testnet_env()) {
        console.log(error);
        return;
    }
    const db = await getPixelPetsDb();
    await db.collection("err").insertOne({ error, user, method, created_at: new Date() });
}

export async function getPixelPetsDb() {
    const db = (await clientPromise).db(pp_mongodb);
    return db;
}

// ---------------

export async function logCryptoHeroErrorDb(error: any, user: string, method: string) {
    if (is_testnet_env()) {
        console.log(error);
        return;
    }
    const db = await getCryptoHeroDb();
    await db.collection("err").insertOne({ error: JSON.stringify(error), user, method, created_at: new Date() });
}

export async function logCryptoHeroDungeonDb(user: string) {
    const db = await getCryptoHeroDb();
    await db.collection("log_dungeons").insertOne({ user, created_at: new Date() });
}


export async function getCryptoHeroDb() {
    const db = (await clientPromise).db(ch_mongodb);
    return db;
}

// ---------------

export async function logChainTeamTacticsErrorDb(error: any, user: string, method: string) {
    if (is_testnet_env()) {
        console.log(error);
        // return;
    }
    const db = await getChainTeamTacticsDb();
    await db.collection("err").insertOne({ error, user, method, created_at: new Date() });
}

export async function getChainTeamTacticsDb() {
    const db = (await clientPromise).db(ctt_mongodb);
    return db;
}

// ---------------

export function isLockTaken(result: any): boolean {
    // when the document doesn't exists...
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":"61ecb551d95ab995aa1198ff","upsertedCount":1,"matchedCount":0}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}

    // when the document already exists...
    //{"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
    //{"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":1}

    return result.modifiedCount == 0 &&
        result.upsertedId != null &&
        result.upsertedCount != 0 &&
        result.matchedCount == 0;
}