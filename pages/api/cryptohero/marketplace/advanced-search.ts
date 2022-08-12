import type { NextApiRequest, NextApiResponse } from 'next'
import { is_defined_request, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { getCryptoHeroDb, logCryptoHeroErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { ClassType, EquipType, RarityType } from '../../../../utils/backend/cryptohero/dungeon/types';
import { AdvancedSearchRequest } from '../../../../utils/backend/cryptohero/helper/types';
import { clamp } from '../../../../utils/backend/common/utils';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: AdvancedSearchRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.itemdata], res)) {
        return;
    }

    if (!is_defined_request([rq.itemdata.class_type, rq.itemdata.equip_type, rq.itemdata.rarity_type, rq.itemdata.minStat], res)) {
        return;
    }

    try {
        const db = await getCryptoHeroDb();
        const filter = {};

        if (rq.itemdata.rarity_type != RarityType.None) {
            filter["item_data.rarity_type"] = rq.itemdata.rarity_type;
        }

        if (rq.itemdata.class_type != ClassType.None) {
            filter["item_data.class_type"] = rq.itemdata.class_type;
        }

        if (rq.itemdata.equip_type != EquipType.Empty) {
            filter["item_data.equip_type"] = rq.itemdata.equip_type;
        }

        rq.itemdata.minStat = clamp(rq.itemdata.minStat, 0, Infinity);
        filter["stat_rank"] = { $gte: rq.itemdata.minStat };

        const entries = await db.collection("marketplace").aggregate([
            {
                $project: {
                    item_data: 1,
                    stat_rank: {
                        $function: {
                            body: get_func_body(),
                            args: ["$item_data"],
                            lang: "js"
                        }
                    }
                }
            },
            {
                $match: filter
            },
            {
                $sort: {
                    _id: -1,
                }
            },
            {
                $limit: 500
            }
        ])
        .toArray();

        entries.forEach(x => {
            x._id = undefined;
            x.stat_rank = undefined;
        });

        res.status(200).json({ success: true, data: entries });
    }
    catch (err) {
        await logCryptoHeroErrorDb(err, rq.account_id, "advanced-search");
        res.status(200).json({ success: false, error: "Contact discord support" });
    }
}

function get_func_body(): string {
    const func = `function (idata) {
            let damage = 0;
            let defense = 0;
            let critChance = 0;
            let lifeSteal = 0;
            let dodge = 0;
            let maxHealth = 0;
        
            switch (idata.class_type) {
                case 1:
                    switch (idata.equip_type) {
                        case 0:
                            defense = (idata.strength + idata.endurance) * .01;
                            maxHealth = 1 + Math.round(idata.endurance * 1.75 + idata.intelligence + idata.luck);
                            dodge = (idata.dexterity + idata.luck) * .01;
                            break;
        
                        case 1:
                            defense = (idata.strength + idata.endurance) * .01;
                            damage = 1 + Math.round((idata.luck + idata.intelligence) * .2);
                            break;
        
                        case 2:
                            damage = 1 + Math.round((idata.luck + idata.intelligence + idata.dexterity + idata.strength) * .25);
                            critChance = (idata.intelligence + idata.luck) * .01;
                            lifeSteal = (idata.intelligence + idata.luck) * .005;
                            break;
        
                        case 3:
                            dodge = .01 + (idata.dexterity + idata.luck) * .01;
                            defense = (idata.strength + idata.endurance) * .01;
                            break;
        
                        case 4:
                            maxHealth = 1 + Math.round((idata.endurance + idata.intelligence) * .5);
                            lifeSteal = (idata.intelligence + idata.luck) * .005;
                            break;
        
                        case 5:
                            critChance = (idata.intelligence + idata.luck) * .01;
                            lifeSteal = .01 + (idata.intelligence + idata.luck) * .005;
                            break;
                    }
                    break;
        
                case 2:
                    switch (idata.equip_type) {
                        case 0:
                            defense = (idata.strength + idata.endurance) * .015;
                            maxHealth = 1 + Math.round(idata.endurance * 2.25 + idata.strength + idata.luck);
                            lifeSteal = (idata.intelligence + idata.luck) * .005;
                            break;
        
                        case 1:
                            defense = (idata.strength + idata.endurance) * .01;
                            maxHealth = 1 + Math.round(idata.endurance * 1.5 + idata.strength);
                            break;
        
                        case 2:
                            damage = 1 + Math.round((idata.luck + idata.strength + idata.dexterity + idata.intelligence) * .25);
                            critChance = (idata.strength + idata.luck) * .01;
                            lifeSteal = (idata.intelligence + idata.luck) * .005;
                            break;
        
                        case 3:
                            defense = .01 + (idata.strength + idata.endurance) * .01;
                            dodge = (idata.dexterity + idata.luck) * .01;
                            break;
        
                        case 4:
                            lifeSteal = (idata.intelligence + idata.luck) * .005;
                            defense = .01 + (idata.strength + idata.endurance) * .01;
                            break;
        
                        case 5:
                            critChance = (idata.strength + idata.luck) * .01;
                            maxHealth = 1 + Math.round((idata.endurance + idata.luck) * .75);
                            break;
                    }
                    break;

                    case 3:
                        switch (idata.equip_type) {
                            case 0:
                                dodge = (idata.dexterity + idata.intelligence) * .01;
                                maxHealth = 1 + Math.round(idata.endurance * 2 + idata.dexterity + idata.luck);
                                defense = (idata.strength + idata.endurance) * .01;
                                break;
            
                            case 1:
                                defense = .01 + (idata.strength + idata.endurance) * .01;
                                dodge = (idata.dexterity + idata.luck) * .01;
                                break;
            
                            case 2:
                                damage = 1 + Math.round((idata.luck + idata.dexterity + idata.strength + idata.intelligence) * .25);
                                critChance = (idata.dexterity + idata.luck) * .01;
                                lifeSteal = (idata.intelligence + idata.luck) * .005;
                                break;
            
                            case 3:
                                defense = (idata.strength + idata.endurance) * .01;
                                dodge = .01 + (idata.dexterity + idata.luck) * .01;
                                break;
            
                            case 4:
                                maxHealth = 1 + Math.round((idata.endurance + idata.dexterity) * .5);
                                critChance = (idata.dexterity + idata.luck) * .01;
                                break;
            
                            case 5:
                                damage = 1 + Math.round((idata.luck + idata.dexterity) * .2);
                                lifeSteal = (idata.intelligence + idata.luck) * .005;
                                break;
                        }
                        break;
            }
        
            const statStruct = {
                maxHealth: maxHealth,
                damage: damage,
                // clamping to not exceed 100%
                defense: Math.max(0, Math.min(defense, 100)),
                dodge: Math.max(0, Math.min(dodge, 100)),
                lifeSteal: Math.max(0, Math.min(lifeSteal, 100)),
                critChance: Math.max(0, Math.min(critChance, 100))
            };

            const statRank = Math.round(
                statStruct.critChance * 100 + statStruct.defense * 100 + statStruct.dodge * 100 +
                statStruct.maxHealth / 4 + statStruct.lifeSteal * 100 + statStruct.damage
            );

            return statRank;
        }`;
    return func;
}