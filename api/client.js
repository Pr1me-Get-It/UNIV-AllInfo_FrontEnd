// src/api/client.js
import axios from "axios";
import { getToken } from "../utils/storage";

const BASE_URL = "http://172.20.57.102:3000"; 

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
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