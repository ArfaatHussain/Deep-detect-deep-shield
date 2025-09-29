import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json())

app.use(cookieParser())

import { authRouter } from "./routes/auth.route.js"

app.use("/auth",authRouter)



export {app}