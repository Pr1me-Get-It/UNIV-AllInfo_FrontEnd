export default {
  expo: {
    scheme: 'univ-allinfo',
    name: 'UNIV-AllInfo',
    slug: 'univ-allinfo',
    version: '0.5.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.univallinfo.app',
    },
    android: {
      package: 'com.univallinfo.app',
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-web-browser',
      'expo-secure-store',
      '@react-native-google-signin/google-signin',
      [
        '@mj-studio/react-native-naver-map',
        {
          client_id: 'ntn7ch5ym4', // TODO: 교체 필요
        },
      ],
    ],
    // [중요] 웹 푸시 설정을 여기에 추가합니다.
    notification: {
      vapidPublicKey:
        'BKrQaYuVBFrVnf8tdJLjNPTSTxFvej_iPkmic2wOsPVTIgrzeyta9FqEa_gT2--MTSk9c-kCLB1J94PV768Wmso',
      serviceWorkerPath: 'expo-service-worker.js',
    },
    extra: {
      eas: {
        projectId: '6120be3f-b18d-4531-af3f-af3f6db51bca',
      },
      naverMapClientId: 'ntn7ch5ym4', // 코드에서 참조할 경우를 대비
    },
  },
};
