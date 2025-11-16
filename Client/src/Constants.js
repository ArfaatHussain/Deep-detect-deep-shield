import Constants from "expo-constants";

export const getDevMachineIP = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

  if (!debuggerHost) return null;
    console.log("IP: ",debuggerHost.split(":")[0]);
    
  return debuggerHost.split(":")[0];
};

export const API_URL = `http://${getDevMachineIP()}:5000`;

