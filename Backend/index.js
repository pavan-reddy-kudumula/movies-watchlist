import "./loadEnv.js"
import express from "express"
import router from "./routes/routers.js"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT

app.use(express.json())
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

mongoose.connect(MONGO_URI)
    .then(() => console.log("connection is successful"))
    .catch(() => console.log("connection failed"))

app.listen(PORT, () => {
    console.log("port is running")
})