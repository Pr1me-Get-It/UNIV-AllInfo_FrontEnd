import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { fetchGoogleEvents } from '../../api/calendarService';
import academicSchedule from '../../constants/academic_schedule.json';
import { processCalendarEvents } from '../../utils/calendarLayout';
import { getData, saveData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

const FIXED_ITEM_HEIGHT = 72; // 캘린더 각 날짜 셀 고정 높이 (일정 텍스트 표시를 위해 여유 있게 설정)

const getTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const TODAY_STR = getTodayStr();

export function useCalendarLogic(navigation: any, route: any) {
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [filterMode, setFilterMode] = useState<string | null>(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(TODAY_STR);

  const { userEmail, isAuthenticated } = useAuth();

  const {
    data: googleEvents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['calendarEvents', userEmail],
    queryFn: fetchGoogleEvents,
    enabled: !!userEmail && isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  useFocusEffect(
    useCallback(() => {
      if (userEmail && isAuthenticated) refetch();
    }, [userEmail, isAuthenticated, refetch]),
  );

  const events = useMemo(() => {
    // 구글 캘린더 이벤트를 '내가 추가한 일정'(type 1)으로 분류
    const formattedGoogleEvents = googleEvents.map((e: any) => ({ ...e, type: 1 }));
    return [...formattedGoogleEvents, ...academicSchedule] as any[];
  }, [googleEvents]);

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    const [sYr, sMo, sDa] = startDate.split('T')[0].split('-').map(Number);
    const [eYr, eMo, eDa] = endDate.split('T')[0].split('-').map(Number);
    
    let curr = new Date(sYr, sMo - 1, sDa);
    const end = new Date(eYr, eMo - 1, eDa);
    
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const visibleEvents = useMemo(() => {
    if (filterMode === null) return [];
    return events.filter((event: any) => {
      if (filterMode === 'all') return true;
      const type = event.hasOwnProperty('type') ? event.type : -1;
      if (type === 2) return true;
      return filterMode === 'undergraduate' ? type === 0 : type === 1;
    });
  }, [events, filterMode]);

  const holidayDates = useMemo(() => {
    const holidays = new Set<string>();
    visibleEvents.forEach((ev: any) => {
      if (ev.type === 2) {
        const s = ev.start.date || ev.start.dateTime?.split('T')[0];
        let end = ev.end?.date || ev.end?.dateTime?.split('T')[0] || s;

        const isGoogleAllDay = ev.start.date && !ev.id.startsWith('knu_');
        if (isGoogleAllDay && ev.end?.date) {
          const [eYr, eMo, eDa] = end.split('T')[0].split('-').map(Number);
          const endDateObj = new Date(eYr, eMo - 1, eDa);
          endDateObj.setDate(endDateObj.getDate() - 1);
          const y = endDateObj.getFullYear();
          const m = String(endDateObj.getMonth() + 1).padStart(2, '0');
          const d = String(endDateObj.getDate()).padStart(2, '0');
          end = `${y}-${m}-${d}`;
        }

        const dates = getDatesInRange(s, end);
        dates.forEach(d => holidays.add(d));
      }
    });
    return holidays;
  }, [visibleEvents]);

  const processedEvents = useMemo(() => {
    return processCalendarEvents(visibleEvents, currentMonth.substring(0, 7));
  }, [visibleEvents, currentMonth]);

  const updatedMarkedDates = useMemo(() => {
    const obj: any = {};
    Object.keys(processedEvents).forEach(date => {
      obj[date] = { marked: true };
    });
    holidayDates.forEach(date => {
      obj[date] = { ...obj[date], isHoliday: true };
    });
    obj[selectedDate] = { ...obj[selectedDate], selected: true };
    return obj;
  }, [processedEvents, holidayDates, selectedDate]);

  const daySelectedEvents = useMemo(() => {
    return visibleEvents.filter((e: any) => {
      const s = e.start.date || e.start.dateTime?.split('T')[0];
      let end = e.end?.date || e.end?.dateTime?.split('T')[0] || s;

      const isGoogleAllDay = e.start.date && !e.id.startsWith('knu_');
      if (isGoogleAllDay && e.end?.date) {
        const endDateObj = new Date(end);
        endDateObj.setDate(endDateObj.getDate() - 1);
        end = endDateObj.toISOString().split('T')[0];
      }

      return selectedDate >= s && selectedDate <= end;
    });
  }, [visibleEvents, selectedDate]);

  useEffect(() => {
    const loadFilter = async () => {
      if (userEmail && isAuthenticated) {
        const safeEmail = userEmail.replace(/\./g, '_');
        const savedFilter = (await getData(STORAGE_KEYS.FILTER_MODE(safeEmail))) as string;
        setFilterMode(savedFilter || 'all');
      } else {
        setFilterMode('all');
      }
    };
    loadFilter();
  }, [userEmail, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      const params = route.params as any;
      if (params?.initialDate) {
        const targetDate = params.initialDate;
        setSelectedDate(targetDate);
        setCurrentMonth(targetDate);

        navigation.setParams({ initialDate: undefined } as any);
      }
    }, [route.params, navigation])
  );

  const handleFilterSelect = async (m: string) => {
    setFilterMode(m);
    setFilterModalVisible(false);
    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
      await saveData(STORAGE_KEYS.FILTER_MODE(safeEmail), m);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    filterMode,
    isFilterModalVisible,
    setFilterModalVisible,
    currentMonth,
    setCurrentMonth,
    isLoading,
    processedEvents,
    updatedMarkedDates,
    daySelectedEvents,
    holidayDates,
    handleFilterSelect,
  };
}
