import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AppText from './AppText';

interface LayedOutEvent {
  id: string;
  summary: string;
  color: string;
  textColor: string;
  colSpan: number;
  slotIndex: number;
  isContinuedFromLastWeek: boolean;
  isContinuedToNextWeek: boolean;
  startDate: string;
}

interface CalendarDayProps {
  date: { dateString: string; day: number };
  state: string;
  events: LayedOutEvent[];
  isSelected: boolean;
  onPress: (dateString: string) => void;
  dayWidth: number;
  isHolidayDate?: boolean;
}

const EVENT_HEIGHT = 14;
const EVENT_MARGIN = 2;
const DATE_HEIGHT = 20;

const EventBlock = memo(({ ev, dayWidth }: { ev: LayedOutEvent; dayWidth: number }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        width: dayWidth * ev.colSpan - 2,
        height: EVENT_HEIGHT,
        top: ev.slotIndex * (EVENT_HEIGHT + EVENT_MARGIN),
        backgroundColor: ev.color,
        borderRadius: 3,
        paddingHorizontal: 2,
        justifyContent: 'center',
        zIndex: 100 + ev.slotIndex,
      }}
    >
      <AppText
        style={{
          fontSize: 10,
          color: ev.textColor,
          fontWeight: 'bold',
          textAlign: 'center',
          width: '100%',
          includeFontPadding: false,
          lineHeight: 12,
        }}
        numberOfLines={1}
      >
        {ev.summary}
      </AppText>
    </View>
  );
});

const CalendarDay = ({
  date,
  state,
  events,
  isSelected,
  onPress,
  dayWidth,
  isHolidayDate,
}: CalendarDayProps) => {
  const isToday = state === 'today';

  const [yr, mo, da] = date.dateString.split('-').map(Number);
  const dayOfWeek = new Date(yr, mo - 1, da).getDay();
  const isHoliday = isHolidayDate || dayOfWeek === 0;

  return (
    <TouchableOpacity
      style={[
        styles.dayBox,
        { width: dayWidth },
        isSelected && styles.selectedDayBox,
      ]}
      onPress={() => onPress(date.dateString)}
      activeOpacity={0.7}
    >
      {/* 날짜 숫자 */}
      <View style={{ height: DATE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          style={[
            styles.dayText,
            isHoliday && styles.holidayText,
            isToday && styles.todayText,
            isSelected && styles.selectedDayText,
          ]}
        >
          {date.day}
        </AppText>
      </View>

      {/* 일정 블록들 (최대 3개 슬롯만 표시) */}
      <View style={styles.eventContainer}>
        {events
          .filter(ev => ev.slotIndex < 3)
          .map((ev) => (
            <EventBlock
              key={`${ev.id}-${ev.startDate}`}
              ev={ev}
              dayWidth={dayWidth}
            />
          ))}
        {/* 4개 이상의 일정이 있을 경우 3번째 슬롯 위치 오른쪽에 + 표시 */}
        {events.some(ev => ev.slotIndex >= 3) && (
          <View style={[styles.moreIndicatorContainer, { top: 2 * (EVENT_HEIGHT + EVENT_MARGIN) }]}>
            <AppText style={styles.moreIndicatorText}>+</AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayBox: {
    alignItems: 'center',
    paddingTop: 2,
    overflow: 'visible',
    zIndex: 10,
    // 고정 높이 지정 (날짜 20 + 최대 3줄 이벤트 = 20 + 3*(14+2) = 68 + 패딩 2 = 70)
    height: 70,
  },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333' },
  holidayText: { color: 'rgb(219, 31, 38)' },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  moreIndicatorContainer: {
    position: 'absolute',
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  moreIndicatorText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    includeFontPadding: false,
    lineHeight: 12,
  },
  eventContainer: {
    width: '100%',
    position: 'absolute',
    top: DATE_HEIGHT + 2,
    left: 0,
    overflow: 'visible',
    zIndex: 20,
  },
});

export default memo(CalendarDay);
