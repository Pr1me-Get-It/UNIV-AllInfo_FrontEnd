# UNIV All Info (FrontEnd)

React Native와 Expo를 사용하여 개발된 대학 정보 통합 관리 애플리케이션입니다.

## 📝 프로젝트 소개

**UNIV All Info**는 대학 생활에 필요한 다양한 정보와 기능을 하나의 앱에서 편리하게 관리할 수 있도록 돕는 모바일 애플리케이션입니다. 학사 일정, 캠퍼스 지도, 공지사항 알림 등 학생들에게 유용한 기능을 제공합니다.

## ✨ 주요 기능

*   **🔑 로그인 및 인증**: Google Sign-In을 통한 간편하고 안전한 로그인 기능을 제공합니다.
*   **📅 캘린더 통합**: 학사 일정 및 개인 일정을 관리하고 확인할 수 있는 캘린더 기능을 제공합니다.
*   **🗺️ 지도 및 위치 서비스**: 캠퍼스 맵을 통해 건물 위치를 확인하고, 검색 및 핀 기능을 통해 원하는 장소를 쉽게 찾을 수 있습니다.
*   **🔍 확대/축소 가능한 뷰**: 상세 정보를 확인하기 위해 이미지나 콘텐츠를 자유롭게 확대하고 축소할 수 있습니다.
*   **🔔 알림 시스템**: 중요한 공지사항이나 일정에 대한 푸시 알림을 받을 수 있습니다.
*   **🍎 사과 게임**: 10이 되는 숫자를 드래그하여 점수를 얻는 미니게임을 제공합니다. (8x17 그리드)
*   **📮 피드백 기능**: 프로필 화면에서 앱에 대한 의견이나 버그 제보를 간편하게 보낼 수 있습니다. (Mock API 연동)
*   **📱 반응형 UI**: 다양한 기기 화면 크기에 최적화된 레이아웃을 제공합니다.

## 🛠️ 기술 스택

이 프로젝트는 다음의 기술들을 사용하여 개발되었습니다.

*   **Framework**: [React Native](https://reactnative.dev/), [Expo](https://expo.dev/)
*   **Navigation**: [React Navigation](https://reactnavigation.org/) (Native Stack, Bottom Tabs)
*   **State & Data Management**: [React Query](https://tanstack.com/query/latest) (서버 상태 관리), Context API (전역 상태 관리)
*   **Storage**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
*   **UI/UX**: Styled Components, Expo Vector Icons

## 🚀 설치 및 시작하기

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계들을 따르세요.

### 필수 요구 사항

*   [Node.js](https://nodejs.org/) (LTS 버전 권장)
*   [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)
*   [Expo Go](https://expo.dev/client) 앱 (모바일 기기에서 테스트 시)

### 설치

1.  저장소를 클론합니다.
    ```bash
    git clone [repository-url]
    cd UNIV-AllInfo_FrontEnd
    ```

2.  의존성 패키지를 설치합니다.
    ```bash
    npm install
    # 또는
    yarn install
    ```

### 실행

개발 서버를 실행합니다.

```bash
npm start
# 또는
npx expo start
```

*   **Android**: `a`를 눌러 Android 에뮬레이터에서 실행하거나, `npm run android` 명령어를 사용하세요.
*   **iOS**: `i`를 눌러 iOS 시뮬레이터에서 실행하거나, `npm run ios` 명령어를 사용하세요. (macOS 필요)
*   **Web**: `w`를 눌러 브라우저에서 실행하거나, `npm run web` 명령어를 사용하세요.

## 📂 프로젝트 구조

`src` 디렉토리의 주요 구조는 다음과 같습니다.

```
src/
├── api/          # API 호출 및 네트워크 관련 로직
├── assets/       # 이미지, 폰트 등 정적 리소스
├── components/   # 재사용 가능한 UI 컴포넌트
├── constants/    # 상수 데이터 (색상, 문자열 등)
├── context/      # Context API를 이용한 전역 상태 관리
├── data/         # 더미 데이터 또는 정적 데이터 파일
├── navigation/   # 네비게이션 설정 (Stack, Tab 등)
├── screens/      # 애플리케이션의 각 화면 (Page)
└── utils/        # 유틸리티 함수 및 헬퍼
```

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)를 따릅니다.
