import type { NextApiRequest, NextApiResponse } from 'next'
import { setup_headers } from '../../../utils/backend/common/rq_utils';
const nearAPI = require("near-api-js");
const b58 = require('b58');

export default async (
    req: NextApiRequest,
    res: NextApiResponse<any>
) => {
    if (req.method === "OPTIONS") {
        setup_headers(req, res);
        return res.status(200).json({});
    }

    setup_headers(req, res);

    try {
        let pair = nearAPI.utils.KeyPairEd25519.fromRandom();
        const privateKey = pair.secretKey
        const pub = pair.getPublicKey().data
        const pubKey = Buffer.from(pub).toString('hex')
        const publicKey = "ed25519:" + b58.encode(Buffer.from(pubKey.toUpperCase(), 'hex'))

        res.status(200).json(
            {
                privateKey,
                publicKey
            }
        );
    } catch (error) {
        console.error('Error in /get-ed25519pair:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
