import { FunctionRequest } from "../../common/types";

export type PlayerTournamentData = {
    account_id: string,
    week_code: string,
    matches_won: number,
    matches_lost: number,
    player_loadout: Array<PlayerLoadoutData>,
    last_fight: number,
    created_at: Date,
}

export type PlayerData = {
    account_id: string,
    matches_won: number,
    matches_lost: number,
    player_rating: number,
    player_loadout: Array<PlayerLoadoutData>,
    last_fight: number,
}

export type PlayerLoadoutData = {
    token_id: string,
    pet_type: number,
    pet_rarity: number,
    pet_level: number,
    pet_trainLevel: number,
    pet_power_level: number,
    pet_experience: number,
}

export type PetType = {
    pet_id: number,
    pet_name: string,
    body_type: number,
    damage_type: number,
    evolution_to: number,
    evolution: number,
    damage: number,
    speed: number,
    defense: number,
    magic: number,
}

export class PetToken {
    public token_id: string;
    public pet_type: number;
    public train_level: number = 0;
    public xp: number = 0;
    public level: number = 1;
    public power_level: number;
    public owner: string;
    public price: string;
    public rarity: number;
    public state: number;
    public state_timer: string;
}

export type OfferPetRequest = FunctionRequest & {
    token_id: string,
    price: string,
}

export type EditPetRequest = FunctionRequest & {
    password: string,
    petdata: {
        pet_id: number,
        pet_name: string,
        damage_type: number,
        body_type: number,
        damage: number,
        speed: number,
        defense: number,
        magic: number,
        evolution: number,
        evolution_to: number,
    }
}

export type CancelOfferPetRequest = FunctionRequest & {
    token_id: string
}

export type MarketplaceSearchRequest = FunctionRequest & {
    token_id: string,
    price: string,
}

export type MarketplaceSearchResponse = FunctionRequest & {
    token_id: string,
    price: string,
}

export type FightRequest = FunctionRequest & {
    playerdata: {
        pet_loadout: string[]
    }
}

// --

export enum LockType {
    Fight = 0,
}