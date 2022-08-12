import { generateCardStats } from "../fight/utils";
import { getPetBaseData } from "./basic_game";
import { viewFunction, APP_CONTRACT } from "../../common/blockchain";
import { PetToken, PetType } from "./types";

export async function scaled_pets_by_ids(pet_ids: string[]): Promise<PetToken[]> {
    if (pet_ids.length > 28) {
        throw "more than 28 ids not supported";
    }

    const pet_base_data = await getPetBaseData();

    let pet_array: PetToken[] = [];

    if (pet_ids.length > 22) {
        const ids_part1 = pet_ids.slice(0, 11);
        const ids_part2 = pet_ids.slice(11, 22);
        const ids_part3 = pet_ids.slice(22, pet_ids.length);
        const pets1 = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids: ids_part1 });
        const pets2 = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids: ids_part2 });
        const pets3 = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids: ids_part3 });
        pet_array = pets1.concat(pets2);
        pet_array = pet_array.concat(pets3);
    }
    else if (pet_ids.length > 11) {
        const ids_part1 = pet_ids.slice(0, 11);
        const ids_part2 = pet_ids.slice(11, pet_ids.length);
        const pets1 = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids: ids_part1 });
        const pets2 = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids: ids_part2 });
        pet_array = pets1.concat(pets2);
    }
    else {
        pet_array = await viewFunction(APP_CONTRACT, "get_pets_by_ids", { pet_ids });
    }

    pet_array.forEach(pet => {
        let petbase = pet_base_data.find(x => x.pet_id == pet.pet_type);
        if (pet.state_timer != "0") {
            pet.state_timer = pet.state_timer.substring(0, pet.state_timer.length - 6);
        }
        if (petbase == null) {
            petbase = { body_type: 1, damage: 40, defense: 40, speed: 40, magic: 40, damage_type: 1, evolution: 0, evolution_to: -1, pet_id: -1, pet_name: 'Dummy' } as PetType;
        }
        pet["combat_info"] = generateCardStats(petbase, pet.rarity + 1, pet.train_level, pet.level, petbase.evolution, pet.power_level, true);
    });

    return pet_array;
}