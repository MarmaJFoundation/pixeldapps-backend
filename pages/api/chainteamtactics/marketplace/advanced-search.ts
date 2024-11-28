import type { NextApiRequest, NextApiResponse } from 'next'
import { is_defined_request, is_valid_request, setup_headers } from '../../../../utils/backend/common/rq_utils';
import { clamp } from '../../../../utils/backend/common/utils';
import { getChainTeamTacticsDb, logChainTeamTacticsErrorDb } from '../../../../utils/backend/common/mongo-helper';
import { AdvancedSearchRequest } from '../../../../utils/backend/chainteamtactics/helper/types';
import { UnitType } from '../../../../utils/backend/chainteamtactics/battle/types';

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    setup_headers(req, res);

    const rq: AdvancedSearchRequest = req.body;

    if (!is_valid_request([rq.account_id, rq.unitdata], res)) {
        return;
    }

    if (!is_defined_request([rq.unitdata.unit_type, rq.unitdata.minStat], res)) {
        return;
    }

    try {
        const db = await getChainTeamTacticsDb();
        const filter = {};

        if (rq.unitdata.unit_type != UnitType.None) {
            filter["unit_data.unit_type"] = rq.unitdata.unit_type;
        }

        // if (rq.unitdata.tier_type != TierType.None) {
        //     filter["unit_data.tier_type"] = rq.unitdata.tier_type;
        // }

        rq.unitdata.minStat = clamp(rq.unitdata.minStat, 0, Infinity);
        filter["stat_rank"] = { $gte: rq.unitdata.minStat };

        const entries = await db.collection("marketplace").aggregate([
            {
                $project: {
                    unit_data: 1,
                    stat_rank: {
                        $function: {
                            body: get_func_body(),
                            args: ["$unit_data"],
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
        await logChainTeamTacticsErrorDb(err, rq.account_id, "advanced-search");
        res.status(200).json({ success: false, error: "Contact Telegram support" });
    }
}

function get_func_body(): string {
    const func = `function (udata) {
            /*let damage = 0;
            let defense = 0;
            let critChance = 0;
            let lifeSteal = 0;
            let dodge = 0;
            let maxHealth = 0;
        
            switch (udata.class_type) {
                case 1:
                    switch (udata.equip_type) {
                        case 0:
                            defense = (udata.strength + udata.endurance) * .01;
                            maxHealth = 1 + Math.round(udata.endurance * 1.75 + udata.intelligence + udata.luck);
                            dodge = (udata.dexterity + udata.luck) * .01;
                            break;
        
                        case 1:
                            defense = (udata.strength + udata.endurance) * .01;
                            damage = 1 + Math.round((udata.luck + udata.intelligence) * .2);
                            break;
        
                        case 2:
                            damage = 1 + Math.round((udata.luck + udata.intelligence + udata.dexterity + udata.strength) * .25);
                            critChance = (udata.intelligence + udata.luck) * .01;
                            lifeSteal = (udata.intelligence + udata.luck) * .005;
                            break;
        
                        case 3:
                            dodge = .01 + (udata.dexterity + udata.luck) * .01;
                            defense = (udata.strength + udata.endurance) * .01;
                            break;
        
                        case 4:
                            maxHealth = 1 + Math.round((udata.endurance + udata.intelligence) * .5);
                            lifeSteal = (udata.intelligence + udata.luck) * .005;
                            break;
        
                        case 5:
                            critChance = (udata.intelligence + udata.luck) * .01;
                            lifeSteal = .01 + (udata.intelligence + udata.luck) * .005;
                            break;
                    }
                    break;
        
                case 2:
                    switch (udata.equip_type) {
                        case 0:
                            defense = (udata.strength + udata.endurance) * .015;
                            maxHealth = 1 + Math.round(udata.endurance * 2.25 + udata.strength + udata.luck);
                            lifeSteal = (udata.intelligence + udata.luck) * .005;
                            break;
        
                        case 1:
                            defense = (udata.strength + udata.endurance) * .01;
                            maxHealth = 1 + Math.round(udata.endurance * 1.5 + udata.strength);
                            break;
        
                        case 2:
                            damage = 1 + Math.round((udata.luck + udata.strength + udata.dexterity + udata.intelligence) * .25);
                            critChance = (udata.strength + udata.luck) * .01;
                            lifeSteal = (udata.intelligence + udata.luck) * .005;
                            break;
        
                        case 3:
                            defense = .01 + (udata.strength + udata.endurance) * .01;
                            dodge = (udata.dexterity + udata.luck) * .01;
                            break;
        
                        case 4:
                            lifeSteal = (udata.intelligence + udata.luck) * .005;
                            defense = .01 + (udata.strength + udata.endurance) * .01;
                            break;
        
                        case 5:
                            critChance = (udata.strength + udata.luck) * .01;
                            maxHealth = 1 + Math.round((udata.endurance + udata.luck) * .75);
                            break;
                    }
                    break;

                    case 3:
                        switch (udata.equip_type) {
                            case 0:
                                dodge = (udata.dexterity + udata.intelligence) * .01;
                                maxHealth = 1 + Math.round(udata.endurance * 2 + udata.dexterity + udata.luck);
                                defense = (udata.strength + udata.endurance) * .01;
                                break;
            
                            case 1:
                                defense = .01 + (udata.strength + udata.endurance) * .01;
                                dodge = (udata.dexterity + udata.luck) * .01;
                                break;
            
                            case 2:
                                damage = 1 + Math.round((udata.luck + udata.dexterity + udata.strength + udata.intelligence) * .25);
                                critChance = (udata.dexterity + udata.luck) * .01;
                                lifeSteal = (udata.intelligence + udata.luck) * .005;
                                break;
            
                            case 3:
                                defense = (udata.strength + udata.endurance) * .01;
                                dodge = .01 + (udata.dexterity + udata.luck) * .01;
                                break;
            
                            case 4:
                                maxHealth = 1 + Math.round((udata.endurance + udata.dexterity) * .5);
                                critChance = (udata.dexterity + udata.luck) * .01;
                                break;
            
                            case 5:
                                damage = 1 + Math.round((udata.luck + udata.dexterity) * .2);
                                lifeSteal = (udata.intelligence + udata.luck) * .005;
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
            );*/

            const statStruct = {
                health: udata.health,
                damage: udata.damage,
                speed: udata.speed
            };

            const statRank = Math.round(
                statStruct.health / 4 + statStruct.speed * 100 + statStruct.damage
            );

            return statRank;
        }`;
    return func;
}