import { oauth2Client, SCOPES } from "./src/config/google-oauth-client.js";

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", 
  scope: SCOPES,
});

console.log("Open this URL in browser and authorize the app:");
console.log(authUrl);