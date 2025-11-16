import Constants from "expo-constants";
import { DEV_API_URL, PROD_API_URL } from "@env";

const getLocalIP = () => {
  const host = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return host ? host.split(":")[0] : "127.0.0.1";
};

// Automatically switch between dev and prod
const isDev = process.env.NODE_ENV !== "production";

export const API_URL = isDev
  ? DEV_API_URL.replace("127.0.0.1", getLocalIP())
  : PROD_API_URL;
