import axios from "axios"
import { API_URL } from "../Constants"
export const getHistory = async (userId) => {
  try {
    return axios.get(`${API_URL}/user/getHistory/${userId}`);
  } catch (error) {
    throw error
  }
}
