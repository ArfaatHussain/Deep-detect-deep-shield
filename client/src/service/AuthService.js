import axios from "axios"
// import { API_URL } from "../Constants"
import { API_URL } from "../../config"
export const register = async (formData) => {
  try {
    console.log("Form Data Recieved: ",formData)
    return axios.post(`${API_URL}/auth/register`, formData, {
      headers: {
         "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.error("Getting error during registration, ", error)
    throw error
  }
}

export const login = async (email, password) => {
  try {

    let requestBody = {
      email,
      password
    }

    const response = await axios.post(`${API_URL}/auth/login`, requestBody)
    return response
  } catch (error) {
    console.log("Getting error during login, ", error)
    throw error
  }
}

