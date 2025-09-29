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
        fs.unlinkSync(filePath);
        console.log("File is uploaded on cloudinary successfully.\nURL received: " + response.url);

        return response;
    } catch (error) {
        console.error("Error from cloudinary: ",error)
        fs.unlinkSync(filePath);
        return null
    }

}

export {uploadFileOnCloudinary}