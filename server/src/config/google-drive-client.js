import { google } from "googleapis";
import path from "path";

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), "src", "config", "service-account.json"),
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

export const drive = google.drive({
  version: "v3",
  auth,
});