import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface DayEvent {
  id: string;
  summary: string;
  displayText?: string[];
  color: string;
  textColor: string;
  isStart: boolean;
  isEnd: boolean;
  dayIndex: number;
}

interface CalendarDayProps {
  date: { dateString: string; day: number };
  state: string;
  events: DayEvent[];
  isSelected: boolean;
  onPress: (dateString: string) => void;
  animatedHeight: any;
  textOpacity: any;
  dayWidth: number;
}

const CalendarDay = ({
  date,
  state,
  events,
  isSelected,
  onPress,
  animatedHeight,
  textOpacity,
  dayWidth,
}: CalendarDayProps) => {
  const isToday = state === 'today';
  const maxEvents = 4;

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.dayBox,
        { width: dayWidth, height: animatedHeight },
        isSelected && styles.selectedDayBox,
      ]}
      onPress={() => onPress(date.dateString)}
      activeOpacity={0.7}>
      <Text
        style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
        {date.day}
      </Text>
      <View style={styles.eventContainer}>
        {events.slice(0, maxEvents).map((ev, i) => {
          let slicedText = '';
          if (ev.displayText && ev.displayText[ev.dayIndex]) {
            slicedText = ev.displayText[ev.dayIndex];
          } else {
            const summary = ev.summary || '일정';
            const charsPerCell = 5;
            const startIdx = ev.dayIndex * charsPerCell;
            slicedText = summary.slice(startIdx, startIdx + charsPerCell);
          }

          return (
            <View
              key={`${ev.id}-${i}`}
              style={[
                styles.block,
                {
                  backgroundColor: ev.color,
                  height: 14,
                  marginBottom: 1,
                  width: '110%',
                  marginLeft: ev.isStart ? '0%' : ev.isEnd ? '-10%' : '-1%',
                  borderTopLeftRadius: ev.isStart ? 3 : 0,
                  borderBottomLeftRadius: ev.isStart ? 3 : 0,
                  borderTopRightRadius: ev.isEnd ? 3 : 0,
                  borderBottomRightRadius: ev.isEnd ? 3 : 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 1,
                },
              ]}>
              {slicedText.length > 0 && (
                <Animated.Text
                  style={[
                    styles.eventTitle,
                    {
                      color: ev.textColor,
                      opacity: textOpacity,
                      textAlign:
                        ev.isStart && ev.isEnd
                          ? 'center'
                          : ev.isStart
                            ? 'right'
                            : ev.isEnd
                              ? 'left'
                              : 'center',
                      fontSize: 9,
                      width: '100%',
                    },
                  ]}
                  numberOfLines={1}>
                  {slicedText}
                </Animated.Text>
              )}
            </View>
          );
        })}
        {events.length > maxEvents && (
          <Text style={{ fontSize: 8, color: '#999', marginTop: 1 }}>
            +{events.length - maxEvents}
          </Text>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayBox: { alignItems: 'center', paddingTop: 5, overflow: 'visible' },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333', marginBottom: 2 },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  eventContainer: { width: '100%', marginTop: 2, paddingHorizontal: 1, overflow: 'visible' },
  block: { marginBottom: 1 },
  eventTitle: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
});

export default memo(CalendarDay);
