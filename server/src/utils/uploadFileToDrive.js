import { drive } from "../config/google-drive-client.js"
import fs from "fs";

export async function uploadFileToDrive(file) {
    try {
        const fileMetadata = {
            name: file.originalname,
            parents: [process.env.FOLDER_ID]
        }
        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
        };
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id",
        });
        const fileId = await response.data.id;
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });
        const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

        fs.unlinkSync(file.path);

        return fileUrl
    } catch (error) {
        fs.unlinkSync(file.path);
        throw error
    }
}