import axios from "axios";
import { PYTHON_API_URL } from "../../config";

export const detectVideo = async (video, owner) => {
    try {
        const url = `${PYTHON_API_URL}/predict-video?explain=lite`;
        const formData = new FormData();

      
        formData.append("video", {
            uri: video.uri,
            type: video.type || "video/mp4",
            name: video.fileName || `video-${Date.now()}.mp4`,
        });    

        formData.append("owner", owner);
        const response = await axios.post(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Accept: "application/json",
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }

}