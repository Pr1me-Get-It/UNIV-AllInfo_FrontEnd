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