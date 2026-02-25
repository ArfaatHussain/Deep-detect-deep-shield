import fs from "fs";
import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
// Load credentials
const credentialsPath = path.join(process.cwd(), process.env.GOOGLE_OAUTH_FILE);
const credentials = JSON.parse(fs.readFileSync(credentialsPath));

const { client_id, client_secret, redirect_uris } = credentials.web;

// Create OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // redirect URI
);

// Scopes for uploading to Drive
export const SCOPES = ["https://www.googleapis.com/auth/drive.file"];