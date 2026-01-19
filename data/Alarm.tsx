import React, { createContext, useState, useCallback, useEffect } from 'react'; 
import { useAuth } from '../context/AuthContext'; 
import { saveData, getData } from '../utils/storage'; 
import { STORAGE_KEYS } from '../constants/storageKeys';

// 1. 데이터 타입 정의
interface MockEvent {
    id: string;
    summary: string;
    location?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
}

interface AlarmProviderProps {
    children: React.ReactNode; 
}
// 공지사항 아이템의 기본 구조 타입
interface AlarmItem {
    id: string | number;
    title: string;
    image?: any;
    source?: string;
    date?: string;
    [key: string]: any; // 기타 추가 필드 허용
}

// 2. Context에서 관리할 상태들의 타입 정의
interface AlarmContextType {
    readStatus: Record<string, boolean>;
    bookmarkStatus: Record<string, AlarmItem>;
    mockEvents: MockEvent[];
    markAsRead: (id: string | number, isRead?: boolean) => void;
    toggleBookmark: (item: AlarmItem) => void;
    addMockEvent: (newEvent: MockEvent) => void;
}

const TODAY_STR = new Date().toISOString().split('T')[0];
const INITIAL_MOCK_EVENTS: MockEvent[] = [
    {
        id: 'dev-1',
        summary: '[개발] 캡스톤 디자인 미팅',
        location: 'IT-4호관',
        start: { dateTime: `${TODAY_STR}T10:00:00` },
    },
    {
        id: 'dev-2',
        summary: '[개발] 백엔드 API 연동 테스트',
        start: { date: TODAY_STR },
    },
];

// Context 초기값 설정
export const AlarmContext = createContext<AlarmContextType>({
    readStatus: {},
    bookmarkStatus: {},
    mockEvents: [],
    markAsRead: () => {},
    toggleBookmark: () => {},
    addMockEvent: () => {},
});


export const AlarmProvider = ({ children }: AlarmProviderProps) => {
    // AuthContext로부터 현재 로그인된 유저의 이메일을 실시간으로 가져옵니다.
    const { userEmail } = useAuth();
    const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
    const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, AlarmItem>>({});
    const [mockEvents, setMockEvents] = useState<MockEvent[]>(INITIAL_MOCK_EVENTS);

    // 특정 유저의 로컬 데이터를 로드하는 함수
    const loadUserData = useCallback(async (email: string | null) => {
    if (!email) return;
    try {
        const bookmarkKey = STORAGE_KEYS.BOOKMARK(email);
        const readKey = STORAGE_KEYS.READ(email);
        const [savedBookmarks, savedReads] = await Promise.all([
            getData<Record<string, AlarmItem>>(bookmarkKey),  
            getData<Record<string, boolean>>(readKey)        
        ]);
        setBookmarkStatus(savedBookmarks || {});
        setReadStatus(savedReads || {});
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}, []);

    // 유저(userEmail)가 변경될 때마다 데이터를 새로 불러옵니다.
    useEffect(() => {
        loadUserData(userEmail);
    }, [userEmail, loadUserData]);

    // 알림 읽음 처리
    const markAsRead = useCallback((id: string | number, isRead: boolean = true) => {
    if (!userEmail) return;
    setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev, [String(id)]: isRead };
        saveData(STORAGE_KEYS.READ(userEmail), newStatus);
        return newStatus;
    });
}, [userEmail]);

    // 북마크 토글
    const toggleBookmark = useCallback((item: AlarmItem) => {
    if (!userEmail) {
        alert("로그인이 필요합니다.");
        return;
    }
    setBookmarkStatus((prev: Record<string, AlarmItem>) => {
        const newStatus = { ...prev };
        const idKey = String(item.id);
        if (newStatus[idKey]) delete newStatus[idKey];
        else newStatus[idKey] = item;
        saveData(STORAGE_KEYS.BOOKMARK(userEmail), newStatus);
        return newStatus;
    });
}, [userEmail]);

    const addMockEvent = useCallback((newEvent: MockEvent) => {
    setMockEvents((prev: MockEvent[]) => [...prev, newEvent]);
}, []);

    return (
        <AlarmContext.Provider value={{
            readStatus,
            bookmarkStatus,
            mockEvents,
            markAsRead,
            toggleBookmark,
            addMockEvent,
        }}>
            {children}
        </AlarmContext.Provider>
    );
};