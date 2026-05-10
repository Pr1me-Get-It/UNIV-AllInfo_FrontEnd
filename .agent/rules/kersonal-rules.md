---
trigger: always_on
---

# Antigravity 에이전트 매뉴얼 및 프로젝트 규칙

이 파일은 **UNIV-AllInfo_FrontEnd** 프로젝트의 표준 및 규칙을 문서화한 것입니다. 앞으로의 모든 코드 변경 시 이 가이드라인을 따라주세요.

## 1. 🛠 기술 스택 (Technology Stack)
- **Framework**: React Native (0.74+)
- **Platform**: Expo (SDK 51+)
- **Language**: TypeScript (Strict Mode)
- **State/API**: React Query (@tanstack/react-query), Context API
- **Animation**: Reanimated 3
- **Styling**: StyleSheet.create

## 2. 📂 코드 구조 (Code Structure)
- **루트 디렉토리**: `src/`는 모든 소스 코드의 홈입니다.
  - `src/screens/`: 페이지 컴포넌트
  - `src/components/`: 재사용 가능한 UI 컴포넌트
  - `src/navigation/`: 네비게이션 설정 (`RootNavigator`, `TabNavigator`)
  - `src/constants/`: 정적 상수 (색상, 텍스트, 키값 등)
  - `src/context/` & `src/api/`: 상태 관리 및 API 로직
- **설정**: 설정 파일들(`package.json`, `tsconfig.json`)은 프로젝트 루트에 유지합니다.

## 3. 🔷 코딩 스타일 가이드라인
- **컴포넌트**: Hooks를 사용한 **함수형 컴포넌트**와 화살표 함수(`const Component = () => {}`)를 사용하세요.
- **타입스크립트**:
  - 확장자: 모든 React 컴포넌트는 `.tsx`, 로직 파일은 `.ts`.
  - 타입: `any` 사용 지양. 명시적인 인터페이스 정의.
- **스타일링**:
  - `StyleSheet.create` 사용.
  - 색상은 하드코딩하지 말고 `src/constants/theme.ts` (또는 `colors.ts`)에서 import.
  - 텍스트는 `AppText` 컴포넌트 사용 권장.

## 4. 🚀 네비게이션
- 새로운 스크린 추가 시 `TabNavigator.tsx` 또는 `RootNavigator.tsx`에 등록.
- `src/` 기준 상대 경로 확인.

## 5. 🛠 유지보수 (Maintenance)
- 사용하지 않는 import 제거.
- 불필요한 콘솔 로그 제거 (프로덕션 빌드 시 자동 제거됨).

## 6. 소통 및 언어
- **한글화**: 모든 계획, 설명, 주석은 **한글**로 작성합니다.
- 답변은 친절하고 전문적으로 합니다.