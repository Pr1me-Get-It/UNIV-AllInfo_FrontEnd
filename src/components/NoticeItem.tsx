import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

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
        <Text style={styles.sourceText}>{item.displaySource}</Text>
        <Text style={[styles.itemText, isRead && styles.readText]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.dateText}>{item.date}</Text>
          {isRead ? (
            <Text style={styles.readLabel}>읽음</Text>
          ) : (
            <Text style={styles.unreadLabel}>NEW</Text>
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
