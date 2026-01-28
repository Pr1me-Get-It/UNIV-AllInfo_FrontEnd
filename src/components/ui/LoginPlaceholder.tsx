import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LoginPlaceholder = ({
  msg = '로그인이 필요한 기능입니다.',
  icon = 'lock-closed-outline',
  targetScreen = 'All', // 설정(로그인) 탭의 이름
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={60} color="#ccc" style={styles.icon} />
      <Text style={styles.msg}>{msg}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate(targetScreen)}>
        <Text style={styles.btnText}>로그인 하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  icon: { marginBottom: 20 },
  msg: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#333', // 혹은 앱 메인 색상인 'rgb(219, 31, 38)'
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

export default LoginPlaceholder;
