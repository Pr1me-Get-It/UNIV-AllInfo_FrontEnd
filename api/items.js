// src/api/items.js
import { api } from "./client";

// 1. 전체 조회
export const getItems = async () => {
  const { data } = await api.get("/items");
  return data;
};

// 2. 단건 조회
export const getItem = async (id) => {
  const { data } = await api.get(`/items/${id}`);
  return data;
};

// 3. 생성 (화면 코드에 맞춰 함수명 addItem, 인자 객체 구조분해로 변경)
export const addItem = async ({ name, description, price }) => {
  const { data } = await api.post("/items", { 
    name,
    description,
    price, 
  });
  return data;
};

// 4. 수정 (화면 코드에 맞춰 인자 객체 구조분해로 변경)
export const updateItem = async (id, { name, description, price }) => {
  const { data } = await api.put(`/items/${id}`, { 
    name,
    description,
    price
  }); 
  return data;
};

// 5. 삭제
export const deleteItem = async (id) => {
  const res = await api.delete(`/items/${id}`);
  // status check는 axios에서 에러를 던지기도 하지만, 명시적으로 체크
  if (res.status !== 200 && res.status !== 204) {
    throw new Error("삭제 실패");
  }
  return true;
};