import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 디자인 가이드 기준 사이즈 (예: iPhone 11 Pro / X 기준 375x812)
// 프로젝트의 디자인 기준이 있다면 이 값을 수정하세요.
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * 가로 크기(width), 좌우 여백(margin/padding), 폰트 크기 등에 사용
 * 화면 너비 비율에 따라 크기를 조정합니다.
 * 예: width: scale(100)
 */
export const scale = (size: number) => {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * 세로 크기(height), 상하 여백(margin/padding) 등에 사용
 * 화면 높이 비율에 따라 크기를 조정합니다.
 * 예: height: verticalScale(50)
 */
export const verticalScale = (size: number) => {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * 폰트 크기나 아이콘 크기 등에 사용
 * scale() 함수가 너무 급격하게 커지거나 작아지는 것을 방지하기 위해 factor를 사용합니다.
 * factor가 0.5(기본값)이면 scale() 결과와 원본 크기의 중간값 정도를 반환합니다.
 * 예: fontSize: moderateScale(16)
 */
export const moderateScale = (size: number, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

/**
 * 화면 너비 반환
 */
export const width = SCREEN_WIDTH;

/**
 * 화면 높이 반환
 */
export const height = SCREEN_HEIGHT;

/**
 * 픽셀 밀도에 따른 폰트 크기 조정 (선택 사항)
 * OS 설정에 따른 폰트 스케일링을 무시하고 싶을 때 사용할 수 있습니다.
 */
export const normalizeFont = (size: number) => {
    const newSize = scale(size);
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
};
