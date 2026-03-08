import { app } from "../app.js";
import mongoose from "mongoose";
import dns from "dns";

// Force Node to use Google DNS for SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const uri = `${process.env.MONGODB_URI}/deepfake`;

  const connectWithRetry = async (retries = 5, delay = 5000) => {
    try {
      const instance = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.info("MongoDB Connected!! Host:", instance.connection.host);

      app.on("error", (error) => {
        console.error("App-level error detected:", error);
      });

    } catch (error) {
      console.error("DB connection error:", error);

      if (retries > 0) {
        console.log(`Retrying in ${delay / 1000}s... (${retries} attempts left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error("Could not connect to MongoDB after multiple attempts.");
        process.exit(1);
      }
    }
  };

  await connectWithRetry();
};

export { connectDB };