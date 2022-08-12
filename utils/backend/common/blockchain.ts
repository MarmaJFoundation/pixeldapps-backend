
import * as nearApi from 'near-api-js';
import getConfig from './server-config';
import { serialize } from 'near-api-js/lib/utils/serialize';
import { functionCall, SCHEMA } from 'near-api-js/lib/transaction';
import axios from 'axios';
import { DEFAULT_FUNCTION_CALL_GAS, WalletConnection } from 'near-api-js';
import BN from 'bn.js';
import { TransactionManager } from "near-transaction-manager";

const config = getConfig();
export const APP_CONTRACT = config.CONTRACT_ID;
export const MANAGER_ACCOUNT = process.env.MANAGER_ACCOUNT || "messages.testnet";
export const MANAGER_KEY = process.env.MANAGER_KEY;
export const MANAGER_KEYS = process.env.MANAGER_KEYS;

export function _onlyPxDapps(account_id: string, password: string | null = null): void {
    const accounts: string[] = [
        "pixeltoken.near",
        "messages.testnet",
        "pxt-manager.near",
        "bubruno.near",
        "bubruno.testnet",
        "pixeltoken.sputnik-dao.near",
        "messagebox.near"
    ];
    if (!accounts.includes(account_id)) {
        throw "Account not allowed to call this method"
    }
    const passwords: string[] = ["47kQydOibGIS8Juh"];
    if (password && !passwords.includes(password)) {
        throw "Account not allowed to call this method"
    }
}

export async function getAccount(account_id: string, private_key: string) {

    if (account_id == "pxt-manager.near") {
        const key_index = Math.floor(Math.random() * MANAGER_KEYS.length);
        private_key = MANAGER_KEYS[key_index];
    }

    const keyPair = nearApi.utils.KeyPair.fromString(private_key);
    const keyStore = new nearApi.keyStores.InMemoryKeyStore();
    keyStore.setKey("default", account_id, keyPair);
    const near = await nearApi.connect({
        networkId: "default",
        deps: { keyStore },
        masterAccount: account_id,
        nodeUrl: config.nodeUrl
    });

    return await near.account(account_id);
}

export function signMessage(input: string, private_key: string) {
    const keyPair = nearApi.utils.KeyPair.fromString(private_key);
    return keyPair.sign(new TextEncoder().encode(input));
}

export async function getAnonAccount() {
    const keyStore = new nearApi.keyStores.InMemoryKeyStore();
    const near = await nearApi.connect({
        networkId: "default",
        deps: { keyStore },
        nodeUrl: config.nodeUrl,
        walletUrl: config.walletUrl,
        helperUrl: config.helperUrl
    });

    return await near.account("");
}

export function getSigningTransactionsWalletUrl(transactions: any[], referrer: string, callbackUrl?: string, meta: string = null) {
    const newUrl = new URL('sign', config.walletUrl);

    newUrl.searchParams.set('transactions', transactions
        .map(transaction => serialize(SCHEMA, transaction))
        .map(serialized => Buffer.from(serialized).toString('base64'))
        .join(','));

    newUrl.searchParams.set('referrer', "Pixelpets Dapp: " + referrer);
    //TODO close window/tab automatically when no callbackurl is set?
    if (callbackUrl) newUrl.searchParams.set('callbackUrl', callbackUrl);
    //if (meta) newUrl.searchParams.set('meta', meta);
    return newUrl.toString();
}

export async function viewFunction(contract, method, args) {
    const account = await getAnonAccount();
    return await account.viewFunction(contract, method, args);
}

export async function changeFunctionWithoutAttachment(account_id, privatekey, contract_id, method, args, gas = DEFAULT_FUNCTION_CALL_GAS) {
    try {
        const nearAccount = await getAccount(account_id, privatekey);
        const response = await nearAccount.functionCall({ contractId: contract_id, methodName: method, args: args, gas, attachedDeposit: new BN("0") });

        if (response.status["SuccessValue"]) {
            return { success: true, data: JSON.parse(Buffer.from(response.status["SuccessValue"], 'base64').toString()) };
        }

        return { success: true, data: undefined };
    }
    catch (err) {
        return { success: false, error: err };
    }
}

export async function changeFunctionWithAttachment(account_id, privatekey, contract_id, method, args, attachedDeposit, callbackUrl, gas = DEFAULT_FUNCTION_CALL_GAS) {
    try {
        const nearAccount = await getAccount(account_id, privatekey);

        const transactionManager = TransactionManager.fromAccount(nearAccount);
        const transaction = await transactionManager.createTransaction({
            receiverId: contract_id,
            actions: [functionCall(method, args || {}, gas, attachedDeposit)],
        });
        const walletUrl = getSigningTransactionsWalletUrl([transaction], "Pixelpets Dapp", callbackUrl);

        return { success: true, data: walletUrl };
    }
    catch (err) {
        return { success: false, error: err };
    }
}

export async function isAccessKeyValid(account_id, publickey) {
    const response = await axios.post(config.nodeUrl, {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
            request_type: 'view_access_key',
            finality: 'final',
            account_id: account_id,
            public_key: publickey
        }
    });

    if (response.data.result && response.data.result.error || response.data.error) {
        return { valid: false, allowance: 0, fullAccess: false };
    }
    if (response.data.result.permission == "FullAccess") {
        return { valid: true, allowance: 20000000000000000000000000, fullAccess: true };
    }
    return { valid: true, allowance: response.data.result.permission.FunctionCall.allowance, fullAccess: false };
}

export function checkFunctionResponse(response: any) {
    if (!response.success) {
        if (!HandledErrorTypes.includes(response.error.type)) {
            throw response.error;
        }
        return false;
    }
    return true;
}

const HandledErrorTypes: string[] = ["LackBalanceForState", "NotEnoughAllowance"]