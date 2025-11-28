export default {
  expo: {
    scheme: "univ-allinfo",
    name: "UNIV-AllInfo",
    slug: "univ-allinfo",
    version: "0.3.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.univallinfo.app"
    },
    android: {
        package: "com.univallinfo.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-web-browser",
      "expo-secure-store"
    ],
    // [중요] 웹 푸시 설정을 여기에 추가합니다.
    notification: {
      vapidPublicKey: "BKrQaYuVBFrVnf8tdJLjNPTSTxFvej_iPkmic2wOsPVTIgrzeyta9FqEa_gT2--MTSk9c-kCLB1J94PV768Wmso",
      serviceWorkerPath: "expo-service-worker.js"
    },
    extra: {
      eas: {
        projectId: "6120be3f-b18d-4531-af3f-af3f6db51bca" 
      }
    }
  }
};