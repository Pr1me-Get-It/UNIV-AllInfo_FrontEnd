// src/api/client.js
import axios from "axios";
import { getToken } from "../utils/storage";
import { API_CONFIG } from '../constants/config';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT, 
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.message || err.message || "요청 실패";
    console.error("API Error:", err);
    return Promise.reject(new Error(msg));
  }
);