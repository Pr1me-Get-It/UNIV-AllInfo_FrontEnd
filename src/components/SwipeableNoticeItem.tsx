import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import NoticeItem from './NoticeItem';

interface SwipeableNoticeItemProps {
  item: any;
  isRead: boolean;
  isBookmarked: boolean;
  showDelete?: boolean;
  showHint?: boolean;
  onPress: (item: any) => void;
  onDelete?: (id: string) => void;
  onBookmark: (item: any) => void;
}

const SwipeableNoticeItem = ({
  item,
  isRead,
  isBookmarked,
  showDelete = false,
  showHint = false,
  onPress,
  onDelete,
  onBookmark,
}: SwipeableNoticeItemProps) => {
  const swipeRef = useRef<Swipeable>(null);
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(nudge, { toValue: -16, duration: 280, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(nudge, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    }, 500);
    return () => clearTimeout(t);
  }, [showHint]);

  const actionWidth = showDelete ? 128 : 64;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const opacity = progress.interpolate({
      inputRange: [0, 0.6, 1],
      outputRange: [0.2, 0.7, 1],
    });

    return (
      <Animated.View style={[styles.actionsRow, { width: actionWidth, opacity }]}>
        <TouchableOpacity
          style={[styles.actionBtn, isBookmarked ? styles.bookmarkedBtn : styles.unbookmarkedBtn]}
          onPress={() => onBookmark(item)}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={20}
            color={isBookmarked ? '#fff' : '#555'} />
        </TouchableOpacity>
        {showDelete && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => onDelete?.(String(item.notice_id || item.id))}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={1.8}
      rightThreshold={actionWidth / 2}>
      <Animated.View style={{ transform: [{ translateX: nudge }], backgroundColor: '#fff' }}>
        <NoticeItem item={item} isRead={isRead} onPress={onPress} />
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkedBtn: {
    backgroundColor: '#FFA000',
  },
  unbookmarkedBtn: {
    backgroundColor: '#e8e8e8',
  },
  deleteBtn: {
    backgroundColor: '#c62828',
  },
});

export default SwipeableNoticeItem;
