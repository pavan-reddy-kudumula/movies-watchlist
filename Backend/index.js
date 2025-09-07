import "./loadEnv.js"
import express from "express"
import router from "./routes/routers.js"
import mongoose from "mongoose"
import cors from "cors"

const app = express()
const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT

const allowedOrigins = [
  'https://movies-watchlist-blond.vercel.app'
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); 
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `CORS policy blocks this origin`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json())
app.use("/", router)

mongoose.connect(MONGO_URI)
    .then(() => console.log("connection is successful"))
    .catch(() => console.log("connection failed"))

app.listen(PORT, () => {
    console.log("port is running")
})