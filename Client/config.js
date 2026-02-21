import Constants from "expo-constants";
import { DEV_API_URL, PROD_API_URL } from "@env";

const getLocalIP = () => {
  const host = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return host ? host.split(":")[0] : "127.0.0.1";
};

// Automatically switch between dev and prod
const isDev = process.env.NODE_ENV !== "production";

// console.log("Using API URL: ",DEV_API_URL)
export const API_URL = `http://${getLocalIP()}:5000`
