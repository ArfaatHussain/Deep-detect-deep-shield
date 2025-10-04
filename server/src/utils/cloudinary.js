import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileOnCloudinary = async (file) => {
    try {
        if (!file) return null;

        let response;

        if (Buffer.isBuffer(file)) {
            response = await cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        console.error("Error uploading to Cloudinary: ", error);
                        return null;
                    }
                    console.log("File uploaded to Cloudinary successfully. URL: ", result.url);
                    return result;
                }
            );
            response.end(file)
        } else if (typeof file === 'string') {
            response = await cloudinary.uploader.upload(file, { resource_type: "auto" });
            console.log("File uploaded to Cloudinary successfully. URL: ", response.url);
        }

        return response;
    } catch (error) {
        console.error("Error uploading file to Cloudinary: ", error);
        return null;
    }
};

export { uploadFileOnCloudinary };
