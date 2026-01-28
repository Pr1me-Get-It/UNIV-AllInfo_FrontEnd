/* screen/SplashScreen.jsx */
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function SplashScreen({ onFinish }) {
  const lottieRef = useRef(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🚩 스플래시 타임아웃 강제 종료');
      onFinish();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/splash_animation.json')}
        autoPlay
        loop={false}
        onAnimationFinish={() => {
          console.log('🚩 스플래시 애니메이션 종료');
          onFinish();
        }}
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '80%',
    height: '80%',
  },
});
