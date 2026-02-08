import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AppText from './AppText';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useCalendarHeight } from '../context/CalendarHeightContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
// AppText is already usable within Animated views if wrapped, but here we animate structure.

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
  dayWidth: number;
}

const CalendarDay = ({
  date,
  state,
  events,
  isSelected,
  onPress,
  dayWidth,
}: CalendarDayProps) => {
  const { itemHeight } = useCalendarHeight();
  const isToday = state === 'today';
  const maxEvents = 4;

  // Animated styles
  const rDayStyle = useAnimatedStyle(() => {
    return {
      height: itemHeight.value,
    };
  });

  const rTextStyle = useAnimatedStyle(() => {
    // Height range: ~50 (collapsed) to ~100 (expanded)
    // Opacity: 0 when < 70, 1 when > 90
    const opacity = interpolate(
      itemHeight.value,
      [60, 90],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  const rDotStyle = useAnimatedStyle(() => {
    // Inverse opacity for dots
    const opacity = interpolate(
      itemHeight.value,
      [50, 80],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity: opacity,
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.dayBox,
        { width: dayWidth },
        rDayStyle,
        isSelected && styles.selectedDayBox,
      ]}
      onPress={() => onPress(date.dateString)}
      activeOpacity={0.7}>
      <AppText
        style={[
          styles.dayText,
          isToday && styles.todayText,
          isSelected && styles.selectedDayText,
        ]}>
        {date.day}
      </AppText>

      {/* Expanded View: List of Events */}
      <Animated.View style={[styles.eventContainer, rTextStyle]}>
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
                <AppText
                  style={[
                    styles.eventTitle,
                    {
                      color: ev.textColor,
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
                </AppText>
              )}
            </View>
          );
        })}
        {events.length > maxEvents && (
          <AppText style={{ fontSize: 8, color: '#999', marginTop: 1 }}>
            +{events.length - maxEvents}
          </AppText>
        )}
      </Animated.View>

      {/* Collapsed View: Dots */}
      <Animated.View style={[styles.dotContainer, rDotStyle]}>
        {events.length > 0 &&
          events.slice(0, 3).map((ev, i) => (
            <View
              key={`dot-${i}`}
              style={[
                styles.dot,
                { backgroundColor: ev.color === '#FEE2E2' ? 'rgb(219, 31, 38)' : '#333' },
              ]}
            />
          ))}
        {events.length > 3 && <View style={[styles.dot, { backgroundColor: '#999' }]} />}
      </Animated.View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayBox: { alignItems: 'center', paddingTop: 5, overflow: 'hidden' },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333', marginBottom: 2 },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  eventContainer: {
    width: '100%',
    marginTop: 2,
    paddingHorizontal: 1,
    position: 'absolute',
    top: 25, // Align below date
    left: 0,
  },
  dotContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 5,
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  block: { marginBottom: 1 },
  eventTitle: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
});

export default memo(CalendarDay);
