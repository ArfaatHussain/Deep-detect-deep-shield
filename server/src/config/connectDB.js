import { app } from "../app.js";
import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        const instance = await mongoose.connect(`${process.env.MONGODB_URI}/deepfake`)
        console.info("MongoDB Connected!! Host: ",instance.connection.host)
        app.on("error",()=>{
            console.error("Error detected by listener: "+error)
        })
    } catch (error) {
        console.error("Error Occurred during connecting database: ",error)
        process.exit(1)
    }
}

export {connectDB}