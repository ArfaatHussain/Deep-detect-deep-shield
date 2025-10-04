
import axios from "axios";
import { API_URL } from "../Constants"; 

export const detectImage = async (file, owner) => {
  try {
    const url = `${API_URL}/image/detectImage`;
    console.log("Posting to:", url, "with owner:", owner);

    const formData = new FormData();

    // Append the file
    formData.append("file", {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: file.fileName || `image-${Date.now()}.jpg`,
    });

    // Append the owner ID
    formData.append("owner", owner);

    // Make POST request
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Let Axios handle FormData
        Accept: "application/json",
      },
      timeout: 60000, // 60 seconds
    });

    console.log("Server response:", response.data);
    return response.data;

  } catch (error) {
    if (error.response) {
      console.error("Server responded:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received. Request was sent:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
};
