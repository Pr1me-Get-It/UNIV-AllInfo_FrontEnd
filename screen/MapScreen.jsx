/* screen/MapScreen.jsx */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>학교지도 서비스 준비 중입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // 기존 앱 톤과 맞춘 배경색
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
});