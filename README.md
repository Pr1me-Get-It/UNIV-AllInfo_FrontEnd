# 🎓 UNIV-AllInfo (대학 생활 알림 도우미)

**UNIV-AllInfo**는 대학생들을 위한 공지사항 관리 및 일정 통합 애플리케이션입니다. 학교 홈페이지의 공지사항을 크롤링하여 보여주고, 중요한 일정을 구글 캘린더와 연동하며, 키워드 알림을 통해 놓치지 말아야 할 정보를 푸시 알림으로 제공합니다.

## ✨ 주요 기능

* **📢 공지사항 모아보기**: 학교 웹사이트의 공지사항을 앱에서 통합하여 조회합니다. (`HomeScreen`)
* **🔖 즐겨찾기 (북마크)**: 나중에 다시 보고 싶은 공지사항을 보관합니다. (`BookmarkScreen`)
* **📅 캘린더 연동**:
    * 구글 캘린더의 일정을 앱 내에서 확인합니다.
    * 공지사항의 마감일(Deadline)을 내 구글 캘린더에 원클릭으로 추가합니다. (`CalendarScreen`, `DetailScreen`)
* **🔔 키워드 알림**: '장학', '인턴', '휴강' 등 관심 있는 키워드를 등록하면 관련 공지가 올라올 때 푸시 알림을 받습니다. (`KeywordScreen`)
* **🔑 로그인 연동**: 구글 계정(Google Sign-In)을 통한 로그인 및 사용자 동기화를 지원합니다. (`SettingsScreen`)

## 🛠 기술 스택 (Tech Stack)

* **Framework**: React Native (with Expo)
* **Language**: JavaScript / JSX
* **Navigation**: React Navigation (Bottom Tabs, Native Stack)
* **State Management**: Context API (AlramContext)
* **Networking**: Axios
* **Auth**: Google Sign-In, Expo Auth Session
* **Notifications**: Expo Notifications
* **Calendar**: React Native Calendars, Google Calendar API

## 📂 폴더 구조 (Directory Structure)

```text
📦 UNIV-AllInfo
├── 📂 api               # Axios 클라이언트 설정 (client.js)
├── 📂 assets            # 이미지, 아이콘 등 정적 리소스
├── 📂 components        # 재사용 가능한 UI 컴포넌트 (ui/)
├── 📂 data              # 전역 상태 관리 (Context API) 및 더미 데이터
├── 📂 screen            # 주요 화면 (Home, Calendar, Detail, Settings 등)
├── 📂 utils             # 유틸리티 함수 (Storage, Notifications)
├── 📄 App.jsx           # 메인 엔트리 포인트 및 네비게이션 설정
├── 📄 app.config.js     # Expo 설정 파일
├── 📄 google-services.json # Firebase 설정 (Android)
└── 📄 package.json      # 의존성 목록
