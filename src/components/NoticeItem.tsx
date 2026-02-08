import React, { memo } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import AppText from './AppText';

interface NoticeItemProps {
  item: any;
  isRead: boolean;
  onPress: () => void;
}

const NoticeItem = ({ item, isRead, onPress }: NoticeItemProps) => {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress}>
      <View style={styles.iconBackground}>
        <Image source={item.image} style={styles.customIcon} />
      </View>

      <View style={styles.textWrapper}>
        <AppText style={styles.sourceText}>{item.displaySource}</AppText>
        <AppText style={[styles.itemText, isRead && styles.readText]} numberOfLines={2}>
          {item.title}
        </AppText>
        <View style={styles.infoRow}>
          <AppText style={styles.dateText}>{item.date}</AppText>
          {isRead ? (
            <AppText style={styles.readLabel}>읽음</AppText>
          ) : (
            <AppText style={styles.unreadLabel}>NEW</AppText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  iconBackground: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customIcon: { width: 30, height: 30, resizeMode: 'contain' },
  textWrapper: { flex: 1 },
  sourceText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemText: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 4 },
  readText: { color: '#aaa' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#888' },
  unreadLabel: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
  readLabel: { fontSize: 12, color: '#bbb', fontWeight: 'normal' },
});

export default memo(NoticeItem);
