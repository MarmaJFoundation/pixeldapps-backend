import { getCryptoHeroDb, logPixelPetsErrorDb } from "../../../../utils/backend/common/mongo-helper";
import { getPreviousWeekCode } from "../../../../utils/backend/common/utils";
import { getRaidscores } from "../../../../utils/backend/cryptohero/helper/basic_game";
import { DifficultyType } from "../../../../utils/backend/cryptohero/dungeon/types";
import { changeFunctionWithoutAttachment, MANAGER_ACCOUNT, MANAGER_KEY } from "../../../../utils/backend/common/blockchain";
import BN from "bn.js";

export default async (req, res) => {

    if (req.body.tk != "abcdefg2021") {
        res.send("okay");
        return;
    }

    const w_code = getPreviousWeekCode();
    const reason = w_code + "-Raid-Medium";

    const easy_entries = await getRaidscores(DifficultyType.Medium, 8, w_code);

    const total_bucket = [];

    const total_boss_defeats = easy_entries.reduce((n, { boss_kills }) => n + boss_kills, 0);
    easy_entries.forEach(element => {
        const tokens = Math.floor(4000 * (element.boss_kills / total_boss_defeats) / 8);
        if (tokens > 0) {
            //console.log("Group " + ((i / 8) + 1) + ": " + tokens + " PXT");
            element.playerNames.forEach(playername => {
                total_bucket.push({ receiver_id: playername, pixeltoken: (tokens * 1000000).toString() });

            });
        }
    });

    const db = await getCryptoHeroDb();

    try {
        await changeFunctionWithoutAttachment(MANAGER_ACCOUNT, MANAGER_KEY, "pixeltoken.near", "reward_tokens", { rewards: total_bucket, reason: reason + " 1/1" }, new BN('200000000000000'));
        await db.collection("distributed_rewards").insertOne({ reason, rewards: total_bucket, created_at: Date.now(), type: 4 });
        //console.log(total_bucket);
        res.statusCode = 200;
        res.send(reason + " done");

    }
    catch (err) {
        await logPixelPetsErrorDb(err, "admin", "reward-raid-medium");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
};
