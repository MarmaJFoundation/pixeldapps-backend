import BN from 'bn.js';
import { keyStores, Near, WalletConnection } from 'near-api-js';
import { parseNearAmount } from 'near-api-js/lib/utils/format';
import getConfig from './config';
import { NotificationManager } from 'react-notifications';


export const config = getConfig();

const DEFAULT_FUNC_CALL_GAS = new BN('50000000000000');


export let ContractAccess;

export let near;

export let walletCon;

export let account_id = "";


export async function initContract(setUserState) {

    near = new Near({
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        ...config,
    });

    walletCon = await new WalletConnection(near, "Pixelpets");
    account_id = walletCon.getAccountId();

    if (account_id != "") {
        const egg_data = await getUserData(account_id);
        setUserState({
            logged: true,
            tokens: egg_data['tokens'],
            pixeltoken: egg_data['pixeltoken']
        });
    }
}

export function requestLogout() {
    walletCon.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
}

export function requestLogin() {
    walletCon.requestSignIn(config.CONTRACT_ID, "PixelDapps");
}


export async function buy_item(type, price) {
    await walletCon.account().functionCall(config.CONTRACT_ID, 'nft_mint', { type: type, receiver_id: account_id }, DEFAULT_FUNC_CALL_GAS, parseNearAmount(price.toString()));
}


export async function getUserData(account_id) {
    const resp = await walletCon.account().viewFunction(config.CONTRACT_ID, "ctt_custom_balance_of", { account_id: account_id });
    return resp;
}

export async function login_aurora() {
    walletCon.requestSignIn("aurora.pool.near", "Claim");
}

export async function claim_aurora() {
    await walletCon.account().functionCall("aurora.pool.near", 'claim', { "account_id": account_id, "token_id": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near", "farm_id": 0 }, DEFAULT_FUNC_CALL_GAS, 1);
}

export async function ctt_token_count() {
    const resp = await walletCon.account().viewFunction(config.CONTRACT_ID, "nft_supply_for_owner", { account_id });
    return resp;
}

export async function is_whitelisted() {
    const resp = await walletCon.account().viewFunction(config.CONTRACT_ID, "ctt_is_wl_user", { account_id });
    return resp;
}

export async function getSupplyData() {
    const resp = await walletCon.account().viewFunction(config.CONTRACT_ID, "get_mint_supply", {});
    return resp;
}

// export async function getspxtBalance() {
//     const resp = await walletCon.account().viewFunction('skyward-pixeltoken.near', "ft_balance_of", { account_id: account_id });
//     return resp;
// }

// export async function unwrapspxt() {
//     await walletCon.account().functionCall('skyward-pixeltoken.near', 'unwrap', { }, DEFAULT_FUNC_CALL_GAS, "1");
// }

export async function invalid_ft_transfer() {
    try {
        await walletCon.account().functionCall(config.CONTRACT_ID, 'ft_transfer', { "receiver_id": account_id }, DEFAULT_FUNC_CALL_GAS);
    }
    catch (err) {
        NotificationManager.success('You should now see PXT in the web wallet.', 'PXT added');
    }
}

export async function unwrap_spxt() {
    await walletCon.account().functionCall("skyward-pixeltoken.near", 'unwrap', {}, DEFAULT_FUNC_CALL_GAS);
}
