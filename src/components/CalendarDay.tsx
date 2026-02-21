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

// Imports will need to be updated to import LayedOutEvent if strictly typed, 
// but since I can't easily change imports without viewing top of file again (I have viewed it though),
// I'll assume LayedOutEvent structure is passed.
// Actually, I should update the interface definition inside this file or import it.
// To keep it simple, I'll update the interface here matching what I defined in calendarLayout.

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
}

const EventBlock = memo(({ ev, dayWidth, itemHeight, rTextStyle }: any) => {
  const EVENT_HEIGHT = 16;
  const EVENT_MARGIN = 2;

  const rEventBlockStyle = useAnimatedStyle(() => {
    const scale = interpolate(itemHeight.value, [50, 100], [0.5, 1], Extrapolation.CLAMP);
    return {
      height: EVENT_HEIGHT * scale,
      top: ev.slotIndex * ((EVENT_HEIGHT + EVENT_MARGIN) * scale),
      borderRadius: 3 * scale,
      paddingVertical: 1, // Add tiny padding to prevent text cutoff
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          width: dayWidth * ev.colSpan - 2, // Slight gap on right
          backgroundColor: ev.color,
          paddingHorizontal: 2,
          justifyContent: 'center',
          zIndex: 100 + ev.slotIndex,
        },
        rEventBlockStyle,
      ]}
    >
      {/* 축소 시 텍스트만 투명도를 0으로 만들기 위해 rTextStyle 적용 */}
      <Animated.View style={[rTextStyle, { width: '100%', alignItems: 'center', justifyContent: 'center' }]}>
        <AppText
          style={{
            fontSize: 10,
            color: ev.textColor,
            fontWeight: 'bold',
            textAlign: 'center',
            width: '100%',
            includeFontPadding: false,
            lineHeight: 12,
            marginTop: 1, // 미세 픽셀 단위 중앙 정렬 조정
          }}
          numberOfLines={1}
        >
          {ev.summary}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
});

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

  // Height constants
  const DATE_HEIGHT = 20; // Height reserved for the date number
  const EVENT_HEIGHT = 16;
  const EVENT_MARGIN = 2; // Vertical margin between slots

  // Animated styles
  const rDayStyle = useAnimatedStyle(() => {
    return {
      height: itemHeight.value,
    };
  });

  const rTextStyle = useAnimatedStyle(() => {
    // Opacity: 0 when < 70, 1 when > 90
    const opacity = interpolate(
      itemHeight.value,
      [60, 90],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rDotStyle = useAnimatedStyle(() => {
    // Inverse opacity for dots
    const opacity = interpolate(
      itemHeight.value,
      [50, 80],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.dayBox,
        rDayStyle,
        isSelected && styles.selectedDayBox,
        // dayWidth is now handled by the parent Calendar, 
        // but we still need to set width explicitely if we want to be safe, 
        // though flex layout usually handles it. 
        // The previous code had { width: dayWidth }
        { width: dayWidth }
      ]}
      onPress={() => onPress(date.dateString)}
      activeOpacity={0.7}
    // CRITICAL: Ensure overflow is visible so events can span across
    >
      <View style={{ height: DATE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedDayText,
          ]}>
          {date.day}
        </AppText>
      </View>

      {/* Expanded View: Absolute Positioned Events */}
      <View style={[styles.eventContainer]}>
        {events.map((ev, i) => (
          <EventBlock
            key={`${ev.id}-${ev.startDate}`}
            ev={ev}
            dayWidth={dayWidth}
            itemHeight={itemHeight}
            rTextStyle={rTextStyle}
          />
        ))}
      </View>

    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayBox: {
    alignItems: 'center',
    paddingTop: 5,
    // overflow: 'hidden' <- REMOVED
    overflow: 'visible',
    zIndex: 10, // Ensure events are above
  },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333' },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  eventContainer: {
    width: '100%',
    position: 'absolute',
    top: 30, // reserved for date
    left: 0,
    overflow: 'visible', // Allow spanning
    zIndex: 20,
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
});

export default memo(CalendarDay);
