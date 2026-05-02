import axios from "axios"
// import { API_URL } from "../Constants"
import { API_URL } from "../../config";
export const getHistory = async (userId) => {
  try {
    return axios.get(`${API_URL}/user/getHistory/${userId}`);
  } catch (error) {
    throw error
  }
}

export const updateUser = async (userId, data) => {
  try {
    const isFormData = data instanceof FormData;

    return axios.patch(`${API_URL}/user/update/${userId}`, data, {
      headers: {
        ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (data) => {
  try {
    console.log('Calling:', `${API_URL}/user/reset-password`);
    const response = await axios.patch(`${API_URL}/user/reset-password`, data)
    return response
  } catch (error) {
    throw error
  }
}

export const deleteHistory = async (userId) => {
  try {
    return axios.delete(`${API_URL}/user/clearHistory/${userId}`);
  } catch (error) {
    throw error
  }
}
