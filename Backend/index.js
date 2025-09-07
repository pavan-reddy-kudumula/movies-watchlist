import "./loadEnv.js"
import express from "express"
import router from "./routes/routers.js"
import mongoose from "mongoose"
import cors from "cors"

const app = express()
const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT

app.use(cors({
  origin: 'movies-watchlist-r4oripc1z-pavan-reddy-s-projects.vercel.app'}))
app.use(express.json())
app.use("/", router)

mongoose.connect(MONGO_URI)
    .then(() => console.log("connection is successful"))
    .catch(() => console.log("connection failed"))

app.listen(PORT, () => {
    console.log("port is running")
})