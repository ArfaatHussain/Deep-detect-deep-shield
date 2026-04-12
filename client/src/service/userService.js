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
    return axios.patch(`${API_URL}/user/update/${userId}`, data);
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
