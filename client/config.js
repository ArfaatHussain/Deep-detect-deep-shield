import Constants from "expo-constants";
import { DEV_API_URL, PROD_API_URL } from "@env";

const getLocalIP = () => {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!debuggerHost) {
    console.warn("⚠️ Could not detect host IP, falling back to localhost");
    return "127.0.0.1";
  }

  return debuggerHost.split(":")[0];
};

const isDev = __DEV__;

// Deepfake detection server (port 5000)
export const API_URL = isDev
  ? `http://${getLocalIP()}:5000`
  : PROD_API_URL;

// Tamper server (port 5001)
export const TAMPER_API_URL = isDev
  ? `http://${getLocalIP()}:5001/tamper`
  : `${PROD_API_URL}/tamper`;

console.log("🌐 API URL:", API_URL);
console.log("🌐 Tamper API URL:", TAMPER_API_URL);
