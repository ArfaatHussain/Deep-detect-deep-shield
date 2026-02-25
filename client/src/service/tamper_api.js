import axios from "axios"
import { API_URL } from "../../config"

export const protectImage = async(form) => {
  try {
      const response = await axios.post(`${API_URL}/tamper/protect`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
} 