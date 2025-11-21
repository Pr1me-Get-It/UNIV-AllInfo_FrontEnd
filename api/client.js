// src/api/client.js
import axios from "axios";
//fsd
const BASE_URL = "http://172.20.57.102:3000"; 

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

// (선택) 공통 에러 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.message || err.message || "요청 실패";
    console.error("API Error:", err);
    return Promise.reject(new Error(msg));
  }
);