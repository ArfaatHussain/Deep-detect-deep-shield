import axios from "axios"
import { API_URL, PYTHON_API_URL } from "../../config"

export const protectImage = async(form) => {
  try {
      const response = await axios.post(`${PYTHON_API_URL}/protect`, form, {
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
      const response = await axios.post(`${PYTHON_API_URL}/verify`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
} 