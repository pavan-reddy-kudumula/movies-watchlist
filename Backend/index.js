import "./loadEnv.js"
import express from "express"
import router from "./routes/routers.js"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT

const MAX_DB_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RECONNECT_LOOP_DELAY_MS = 5000;
let isConnecting = false;
let reconnectTimeout = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async () => {
    for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
        try {
            await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log("connection is successful");
            return true;
        } catch (error) {
            const isLastAttempt = attempt === MAX_DB_RETRIES;
            console.log(`connection attempt ${attempt} failed: ${error.message}`);

            if (isLastAttempt) {
                console.log("all connection attempts failed");
                return false;
            }

            await sleep(RETRY_DELAY_MS);
        }
    }

    return false;
};

const connectWithRetryLoop = async () => {
    if (isConnecting || mongoose.connection.readyState === 1) {
        return;
    }

    isConnecting = true;
    clearTimeout(reconnectTimeout);

    const isConnected = await connectWithRetry();
    isConnecting = false;

    if (!isConnected) {
        console.log(`retrying database connection in ${RECONNECT_LOOP_DELAY_MS / 1000}s`);
        reconnectTimeout = setTimeout(connectWithRetryLoop, RECONNECT_LOOP_DELAY_MS);
    }
};

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    "http://localhost:5173",
    "https://movies-watchlist-blond.vercel.app"
]
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))
app.use("/", router)

mongoose.connection.on("disconnected", () => {
    console.log("database disconnected");
    connectWithRetryLoop();
});

process.on('SIGINT', async () => {
    console.log('Server shutting down: closing MongoDB connection');
    clearTimeout(reconnectTimeout);
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Server terminating: closing MongoDB connection');
    clearTimeout(reconnectTimeout);
    await mongoose.connection.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log("port is running")
})

connectWithRetryLoop();