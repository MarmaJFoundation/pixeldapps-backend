import type { NextApiRequest, NextApiResponse } from 'next'
import nacl from 'tweetnacl';
import { getCachedBannedAccounts } from '../cryptohero/helper/basic_game';
import { isAccessKeyValid, signMessage } from './blockchain';
const b58 = require('b58');

export function setup_headers(req: NextApiRequest, res: NextApiResponse): void {
    res.setHeader('Access-Control-Allow-Credentials', "true")
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT")
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers,Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers");
    if (req.method === "OPTIONS") {
        return res.status(200).json({});
    }
}

export async function is_account_banned(account_id: string, res: NextApiResponse<any>): Promise<boolean> {
    const account_ids: string[] = await getCachedBannedAccounts();
    if (account_ids.includes(account_id)) {
        res.status(200).json({ success: false, error: "Account temporarily banned, contact our Telegram support" });
        return true;
    }
    return false;
}

export function is_valid_request(params: any[], res: NextApiResponse<any>): boolean {
    for (let i: number = 0; i < params.length; i++) {
        if (!params[i]) {
            return bad_request(res)
        }
    }
    return true
}

export function is_defined_request(params: any[], res: NextApiResponse<any>): boolean {
    for (let i: number = 0; i < params.length; i++) {
        if (params[i] == undefined) {
            return bad_request(res)
        }
    }
    return true
}

export async function is_trusted_requestor(account_id: string, privkey: string, b58pubKey: string, res: NextApiResponse<any>): Promise<boolean> {
    const keyState = await isAccessKeyValid(account_id, b58pubKey);
    if (!keyState.valid) {
        return forbid_request(res);
    }
    const input_msg = "signedmsg";
    const signedMessage = signMessage(input_msg, privkey);
    const pubkey_bytes = b58.decode(b58pubKey.replace("ed25519:", ""));
    const verify = nacl.sign.detached.verify(new TextEncoder().encode(input_msg), signedMessage.signature, pubkey_bytes);
    if (!verify) {
        return forbid_request(res);
    }
    return true;
}

function bad_request(res: NextApiResponse<any>): boolean {
    res.status(400).json({
        success: false,
        error: "Not all required parameters are set.",
    })
    return false
}

function forbid_request(res: NextApiResponse<any>): boolean {
    res.status(403).json({
        success: false,
        error: "Not allowed.",
    })
    return false
}

const fromHexString = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));