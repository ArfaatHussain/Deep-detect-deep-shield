import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileOnCloudinary = async (filePath) => {

    try {
        if (!filePath) return null;

        console.log("Uploading file to cloudinary...")
        const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })

        console.log("File is uploaded on cloudinary successfully.\nURL received: " + response.url);

        return response;
    } catch (error) {
        return null;
    }

}

export {uploadFileOnCloudinary}