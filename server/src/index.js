import { connectDB } from "./db/connectDB.js";

import { app } from "./app.js";
import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})

connectDB()



app.listen(process.env.SERVER_PORT,()=>{
    console.log("Server is running on port ",process.env.SERVER_PORT)
})

