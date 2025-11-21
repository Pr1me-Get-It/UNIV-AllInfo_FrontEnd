// components/Calculator.jsx
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Calculator() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState(null);

  const calculatesum = () => {
    const sum = parseFloat(num1) + parseFloat(num2);
    if (isNaN(sum)) {
      Alert.alert('입력 오류', '유효한 숫자를 입력해주세요');
      return;
    }
    setResult(sum);
  };

  const calculatesub = () => {
    const sub = parseFloat(num1) - parseFloat(num2);
    if (isNaN(sub)) {
      Alert.alert('입력 오류', '유효한 숫자를 입력해주세요');
      return;
    }
    setResult(sub);
  };

  const calculatemul = () => {
    const mul = parseFloat(num1) * parseFloat(num2);
    if (isNaN(mul)) {
      Alert.alert('입력 오류', '유효한 숫자를 입력해주세요');
      return;
    }
    setResult(mul);
  };

  const calculatediv = () => {
    const parsedNum1 = parseFloat(num1);
    const parsedNum2 = parseFloat(num2);
    if (isNaN(parsedNum1) || isNaN(parsedNum2)) {
      Alert.alert('유효한 숫자를 입력해주세요'); 
      return;
    }

    if (parsedNum2 === 0) {
      Alert.alert('0으로 나눌 수 없습니다'); 
      return;
    }
    const div = parsedNum1 / parsedNum2;
    setResult(div);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="숫자 1"
        value={num1}
        onChangeText={setNum1}
      />
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="숫자 2"
        value={num2}
        onChangeText={setNum2}
      />
      <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button title="+" onPress={calculatesum} color="#3498db" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="-" onPress={calculatesub} color="#e74c3c" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="*" onPress={calculatemul} color="#dcd920ff" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="/" onPress={calculatediv} color="#1dbe4bff" />
          </View>
        </View>
      {result !== null && <Text style={styles.result}>결과: {result}</Text>}
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row', // 핵심: 자식 요소(View)들을 가로로 배치
    justifyContent: 'space-between', // 양쪽 끝으로 정렬
    marginTop: 10, // 인풋과의 간격
  },
  buttonWrapper: {
    flex: 1, // 사용 가능한 공간을 1:1 비율로 나눠 가짐
    marginHorizontal: 5, // 버튼 사이의 간격
    borderRadius: 8, // (iOS에서 Button 색상이 적용될 때 모서리)
    overflow: 'hidden', // 둥근 모서리 적용
  },
  result: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
