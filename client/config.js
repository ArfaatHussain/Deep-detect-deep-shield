import Constants from "expo-constants";

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

// Node server (port 5000)
export const API_URL = `http://${getLocalIP()}:5000`

export const PYTHON_API_URL = `http://${getLocalIP()}:5001` // NGROK URL for Python API (port 8000)

console.log("🌐 API URL:", API_URL);
console.log("🌐 Python API URL:", PYTHON_API_URL);
