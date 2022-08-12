import { MongoClient } from 'mongodb'

const uri = "mongodb+srv://" + process.env.MNG;
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}

let client
let clientPromise: Promise<MongoClient>

if (!process.env.MNG) {
    throw new Error('Please add your Mongo URI to .env.local')
}

if (process.env.NEXT_PUBLIC_NEAR_NETWORK_ID === 'testnet') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    //@ts-ignore
    if (!global._mongoClientPromise) {
        //@ts-ignore
        client = new MongoClient(uri, options)
        //@ts-ignore
        global._mongoClientPromise = client.connect();
    }
    //@ts-ignore
    clientPromise = global._mongoClientPromise
} else {
    // In production mode, it's best to not use a global variable.
    //@ts-ignore
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;