import React, { memo } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import AppText from './AppText';
import { moderateScale } from '../utils/responsive';

interface NoticeItemProps {
  item: any;
  isRead: boolean;
  onPress: (item: any) => void;
}

const NoticeItem = ({ item, isRead, onPress }: NoticeItemProps) => {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={() => onPress(item)}>
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
    paddingVertical: moderateScale(8, 0.3),
    paddingHorizontal: moderateScale(4, 0.3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  iconBackground: {
    width: moderateScale(30, 0.3),
    height: moderateScale(30, 0.3),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8, 0.3),
  },
  customIcon: { width: moderateScale(28, 0.3), height: moderateScale(28, 0.3), resizeMode: 'contain' },
  textWrapper: { flex: 1 },
  sourceText: {
    fontSize: moderateScale(10, 0.3),
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: moderateScale(1, 0.3),
    includeFontPadding: false,
  },
  itemText: {
    fontSize: moderateScale(14, 0.3),
    color: '#333',
    fontWeight: '500',
    marginBottom: moderateScale(2, 0.3),
    includeFontPadding: false,
    lineHeight: moderateScale(18, 0.3),
  },
  readText: { color: '#aaa' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: moderateScale(11, 0.3), color: '#888', includeFontPadding: false },
  unreadLabel: { fontSize: moderateScale(11, 0.3), color: COLORS.primary, fontWeight: 'bold', includeFontPadding: false },
  readLabel: { fontSize: moderateScale(11, 0.3), color: '#bbb', fontWeight: 'normal', includeFontPadding: false },
});

export default memo(NoticeItem);
