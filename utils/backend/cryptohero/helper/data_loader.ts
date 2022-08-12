import BN from "bn.js";
import { APP_CONTRACT, changeFunctionWithoutAttachment, MANAGER_ACCOUNT, MANAGER_KEY, viewFunction } from "../../common/blockchain";
import { ItemToken } from "./types";
import { MaxItems } from "./utils";

const MAX_RESULTS_PER_CALL: number = 25;
/*
 * MAX_RESULTS_PER_CALL /  GAS
 *          09          / 23~32
 *          10          / 27~36
 *          12          / 34~45
 *          25          / 132~151
 *          30          / 158~173   -   its over 200 nowadays...
 */

export async function get_items_by_ids(item_ids: string[]): Promise<ItemToken[]> {
    if (item_ids.length > MaxItems) {
        throw `more than ${MaxItems} ids not supported`;
    }

    const max_results = Math.min(item_ids.length, MAX_RESULTS_PER_CALL);
    let count = Math.ceil(item_ids.length / max_results);
    let item_tokens: ItemToken[] = [];

    if ((count % 2) != 0) {
        count++;
    }

    for (let i = 0; i < count; i++) {
        const startAt = max_results * i;
        const endAt = Math.min(startAt + max_results, item_ids.length);

        if (startAt >= endAt) {
            break;
        }

        const current_slice = item_ids.slice(startAt, endAt);
        if (current_slice.length != 0) {
            const current_items = await viewFunction(
                APP_CONTRACT,
                "ch_get_items_by_ids",
                { token_ids: current_slice }
            );
            // const current_items = (await changeFunctionWithoutAttachment(
            //     MANAGER_ACCOUNT,
            //     MANAGER_KEY,
            //     APP_CONTRACT,
            //     "ch_get_items_by_ids",
            //     { token_ids: current_slice },
            //     new BN('300000000000000')// 300
            // )).data;
            item_tokens = item_tokens.concat(current_items);
        }
    }

    return item_tokens;
}

export async function get_characters_by_ids(char_ids: string[]): Promise<any[]> {
    let characters: any[] = [];
    if (char_ids.length != 0) {
        const chars_result = await viewFunction(
            APP_CONTRACT,
            "ch_get_characters_by_ids",
            { character_ids: char_ids }
        );
        characters = characters.concat(chars_result);
        for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            if (character.injured_timer != "0") {
                character.injured_timer = character.injured_timer.substring(0, character.injured_timer.length - 6);
            }
        }
    }
    return characters;
}