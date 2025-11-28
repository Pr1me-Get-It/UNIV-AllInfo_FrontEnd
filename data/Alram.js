// data/Alram.js
import React, { createContext, useState } from 'react';

export const AlramContext = createContext({
    readStatus: {},
    bookmarkStatus: {},     
    markAsRead: () => {}, 
    toggleBookmark: () => {},
});

export const AlramProvider = ({ children }) => {
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});

  const markAsRead = (id, isRead = true) => {
    setReadStatus(prev => ({
      ...prev,          
      [id]: isRead      
    }));
  };

  //item 전체를 받아서 처리
  const toggleBookmark = (item) => {
    setBookmarkStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[item.id]) {
        delete newStatus[item.id];
      } else {
        newStatus[item.id] = item;
      }
      return newStatus;
    });
  }

  return (
    <AlramContext.Provider value={{ 
        readStatus: readStatus || {}, 
        bookmarkStatus: bookmarkStatus || {},
        markAsRead, 
        toggleBookmark 
    }}>
      {children}
    </AlramContext.Provider>
  );
};