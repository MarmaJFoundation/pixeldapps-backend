import BN from "bn.js";
import { APP_CONTRACT, changeFunctionWithoutAttachment, MANAGER_ACCOUNT, MANAGER_KEY, viewFunction } from "../../common/blockchain";
import { UnitData } from "../battle/types";
import { getUnitBaseData } from "./basic_game";
import { UnitScaledToken, UnitToken } from "./types";
import { MaxUnitsPerAccount } from "./utils";

const MAX_RESULTS_PER_CALL: number = 18;
/*
 * MAX_RESULTS_PER_CALL /  GAS
 *          18          / *pending*
 */

export async function get_units_by_ids(unit_ids: string[]): Promise<UnitScaledToken[]> {
    if (unit_ids.length > MaxUnitsPerAccount) {
        throw `more than ${MaxUnitsPerAccount} ids not supported`;
    }

    const base_unit_data = await getUnitBaseData();
    const max_results = Math.min(unit_ids.length, MAX_RESULTS_PER_CALL);
    let count = Math.ceil(unit_ids.length / max_results);
    let unit_tokens: UnitToken[] = [];

    if ((count % 2) != 0) {
        count++;
    }

    for (let i = 0; i < count; i++) {
        const startAt = max_results * i;
        const endAt = Math.min(startAt + max_results, unit_ids.length);

        if (startAt >= endAt) {
            break;
        }

        const current_slice = unit_ids.slice(startAt, endAt);
        if (current_slice.length != 0) {
            const current_units = await viewFunction(
                APP_CONTRACT,
                "ctt_get_units_by_ids",
                { token_ids: current_slice }
            );
            // const current_units = (await changeFunctionWithoutAttachment(
            //     MANAGER_ACCOUNT,
            //     MANAGER_KEY,
            //     APP_CONTRACT,
            //     "ctt_get_units_by_ids",
            //     { token_ids: current_slice },
            //     new BN('300000000000000')// 300
            // )).data;
            unit_tokens = unit_tokens.concat(current_units);
        }
    }
    const unit_scaled_tokens: UnitScaledToken[] = [];
    unit_tokens.forEach(token => {


        const test = new UnitScaledToken();
        test.token_id = token.token_id;
        test.unit_type = token.unit_type;
        test.owner = token.owner;
        test.price = token.price;

        const base_unit = base_unit_data?.filter(x => x.unit_type == token.unit_type)
        if (base_unit) {
            test.damage = Math.ceil(base_unit[0].damage * token.damage_mod / 100);
            test.health = Math.ceil(base_unit[0].health * token.health_mod / 100);
            test.speed = Math.ceil(base_unit[0].speed * token.speed_mod / 100);
            test.power = Math.floor((token.damage_mod + token.health_mod + token.speed_mod) / 3);
        }
        unit_scaled_tokens.push(test);
    });

    return unit_scaled_tokens;
}