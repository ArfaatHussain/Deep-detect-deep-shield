import axios from "axios"
import { API_URL, PYTHON_API_URL } from "../../config"

export const protectImage = async(form) => {
  try {
      const response = await axios.post(`${PYTHON_API_URL}/embed`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
} 

export const verifyImage = async(form) => {
  try {
      const response = await axios.post(`${PYTHON_API_URL}/extract`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
} 