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

app.use("/uploads", express.static("uploads"))

import { authRouter } from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import imageRouter from "./routes/image.route.js"
import tamperRouter from "./routes/tamper.route.js"
import videoRouter from "./routes/video.route.js"


// Testing route
app.get("/", (req, res) => {
    res.json({ message: "Node server is running!" });
})

app.use("/auth",authRouter)
app.use("/user",userRouter)
app.use("/image",imageRouter)
app.use("/tamper",tamperRouter)
app.use("/video",videoRouter)




export {app}