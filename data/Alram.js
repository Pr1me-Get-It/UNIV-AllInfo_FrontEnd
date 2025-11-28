/* data/Alram.js */
import React, { createContext, useState, useCallback } from 'react'; // 👈 useCallback 추가

export const AlramContext = createContext({
    readStatus: {},
    bookmarkStatus: {},     
    markAsRead: () => {}, 
    toggleBookmark: () => {},
});

export const AlramProvider = ({ children }) => {
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});

  // 👇 useCallback으로 감싸서 함수가 재생성되는 것을 막습니다.
  const markAsRead = useCallback((id, isRead = true) => {
    setReadStatus(prev => ({
      ...prev,          
      [id]: isRead      
    }));
  }, []); // 의존성 배열 [] (처음 한 번만 생성)

  // 👇 여기도 마찬가지로 적용해 주는 것이 좋습니다.
  const toggleBookmark = useCallback((item) => {
    setBookmarkStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[item.id]) {
        delete newStatus[item.id];
      } else {
        newStatus[item.id] = item;
      }
      return newStatus;
    });
  }, []);

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