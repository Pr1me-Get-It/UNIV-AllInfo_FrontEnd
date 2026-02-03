// data/Alram.js
import React, { createContext, useState } from 'react';

export const AlramContext = createContext({  // Context : “전역으로 공유하는 값”
    userEmail: null,
    readStatus: {},     // -> 읽음표시, 북마크표시 관리
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

  const toggleBookmark = (id) => {
    setBookmarkStatus(prev => ({
      ...prev,
      [id]: !prev[id]  
    }));
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