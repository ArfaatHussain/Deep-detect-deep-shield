import { v2 as cloudinary } from 'cloudinary';
import fs from "fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            throw new Error("File path is required.");
        }

        console.log("Uploading file ",filePath)
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
            folder: "my-app/uploads",
        });
        console.log("file ",filePath," uploaded...")

        await fs.unlink(filePath);

        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);

        try {
            if (filePath) await fs.unlink(filePath);
        } catch (err) {
            console.warn("File deletion failed:", err.message);
        }

        throw error;
    }
};