
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet ,Image} from 'react-native';

export default function RandomStock() {
  const [message, setMessage] = useState('오늘의 주식을 확인하세요');
  const [color, setColor] = useState('#333'); 

  const [currentImage, setCurrentImage] = useState(require('./assets/ne.jpg'));
  
  const today = new Date();
  const dateString = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });


  const handleDraw = () => {
    const randomNum = Math.random();

    if (randomNum < 0.5) {
      setMessage('🚀 개떡상! 상승장입니다!');
      setColor('#e74c3c'); 
      setCurrentImage(require('./assets/up.jpg'));
    } else {
      setMessage('💧 개떡락... 하락장입니다...');
      setColor('#3498db'); 
      setCurrentImage(require('./assets/down.jpg'));
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.dateText}>{dateString}</Text>
      <Text style={styles.header}>주식 운세 뽑기</Text>
        <View style={styles.imageContainer}>
        {currentImage && (
            <Image 
                source={currentImage} 
                style={styles.stockImage} 
            />
        )}
      </View>
    
      <View style={styles.resultBox}>
        <Text style={[styles.resultText, { color: color }]}>
            {message}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleDraw}>
        <Text style={styles.buttonText}>결과 확인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
    dateText: {
    fontSize: 16,
    color: '#7f8c8d', 
    marginBottom: 5,
    fontWeight: '600',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#333',
  },
  resultBox: {
    height: 100, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  resultText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});