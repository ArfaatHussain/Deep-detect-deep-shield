import axios from "axios"
import { API_URL } from "../../config"

export const login = async (email, password) => {
  try {

    let requestBody = {
      email,
      password
    }

    const response = await axios.post(`${API_URL}/auth/login`, requestBody)
    return response
  } catch (error) {
    // console.error("Getting error during login, ", error)
    throw error
  }
}


export const requestRegisterOTP = async (data) => {

  try {
    const response = await axios.post(`${API_URL}/auth/register/request-otp`, data);
    return response;
  } catch (error) {
    throw error;
  }
}

export const verifyOTP = async ({email, otp, purpose}) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register/verify-otp`, { email, otp, purpose });
    return response;
  } catch (error) {
    throw error;
    // console.error("Error during OTP verification, ", error)
  }

};

export const register = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    });
    return response;
  } catch (error) {
    throw error;
    // console.error("Error during registration, ", error)
  }
}

export const resendOTP = async (email, purpose) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-otp`, { email, purpose });
    return response;
  } catch (error) {
    throw error;
    // console.error("Error during OTP resend, ", error)
  }
}


