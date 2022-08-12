import BN from "bn.js";
import { getLeaderboard } from "../../../../utils/backend/pixelpets/helper/basic_game";
import { changeFunctionWithoutAttachment, MANAGER_ACCOUNT, MANAGER_KEY } from "../../../../utils/backend/common/blockchain";
import { getPixelPetsDb, logPixelPetsErrorDb } from "../../../../utils/backend/common/mongo-helper";
import { getCurrentWeekCode } from "../../../../utils/backend/common/utils";

export default async (req, res) => {

    if (req.body.tk != "abcdefg2021") {
        res.send("okay");
        return;
    }

    const reason = getCurrentWeekCode() + "-Global";

    const entries = await getLeaderboard(60);

    const total_bucket = [];


    entries.forEach((element, index) => {
        total_bucket.push({ receiver_id: element.account_id, pixeltoken: calculateReward(index + 1, 1) });
    });
    const db = await getPixelPetsDb();

    try {
        const resp = await changeFunctionWithoutAttachment(MANAGER_ACCOUNT, MANAGER_KEY, "pixeltoken.near", "reward_tokens", { rewards: total_bucket, reason: reason + " 1/1" }, new BN('200000000000000'));
        if(!resp.success) {
            throw "Distribution not possible."
        }
        await db.collection("distributed_rewards").insertOne({ reason, rewards: total_bucket, created_at: Date.now(), type: 1 });

        res.statusCode = 200;
        res.send(reason + " done");
    }
    catch (err) {
        await logPixelPetsErrorDb(err, "admin", "reward-global");
        res.status(200).json({ success: false, error: err });
    }
};

function calculateReward(place: number, factor: number = 1) {
    let pixeltoken = 0;
    if (place < 2) {
        pixeltoken = 250 * factor;
    } else if (place < 3) {
        pixeltoken = 200 * factor;
    } else if (place < 4) {
        pixeltoken = 150 * factor;
    } else if (place < 5) {
        pixeltoken = 125 * factor;
    } else if (place < 11) {
        pixeltoken = 100 * factor;
    }
    else if (place < 21) {
        pixeltoken = 90 * factor;
    }
    else if (place < 31) {
        pixeltoken = 80 * factor;
    }
    else if (place < 41) {
        pixeltoken = 70 * factor;
    }
    else if (place < 51) {
        pixeltoken = 60 * factor;
    }
    else if (place < 61) {
        pixeltoken = 50 * factor;
    }
    return (pixeltoken * 1000000).toString();
}
