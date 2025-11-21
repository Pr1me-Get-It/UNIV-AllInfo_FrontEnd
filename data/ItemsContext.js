// data/ItemsContext.js
import React, { createContext, useState } from 'react';
import { mockItems } from './mockItems';

// [핵심] 괄호 안에 기본값을 넣어서, Provider가 실수로 없어도 에러 안 나게 함
export const ItemsContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateItem: () => {},
  getItem: () => {},
});

export const ItemsProvider = ({ children }) => {
  // 혹시 mockItems가 undefined일까봐 || [] 추가
  const [items, setItems] = useState(mockItems || []);

  const addItem = (item) => setItems(prev => [...prev, item]);
  const removeItem = (id) => setItems(prev => prev.filter(x => x.id !== id));
  const updateItem = (id, patch) => setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  const getItem = (id) => items.find(x => x.id === id);

  return (
    <ItemsContext.Provider value={{ items: items || [], addItem, removeItem, updateItem, getItem }}>
      {children}
    </ItemsContext.Provider>
  );
};