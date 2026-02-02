import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
    children: React.ReactNode;
}

/**
 * 전역적으로 사용할 커스텀 텍스트 컴포넌트
 * 기본적으로 'Pretendard-Regular'를 사용하며,
 * style에 fontWeight가 'bold'인 경우 'Pretendard-Bold'로 자동 전환합니다.
 */
export const CustomText = (props: CustomTextProps) => {
    const { style, ...otherProps } = props;

    // 스타일 객체 평탄화
    const flattenedStyle = StyleSheet.flatten(style) || {};

    // 폰트 패밀리 결정 로직
    let fontFamily = 'Pretendard-Regular';
    const fontWeight = flattenedStyle.fontWeight;

    if (fontWeight === 'bold' || fontWeight === '700') {
        fontFamily = 'Pretendard-Bold';
    } else if (fontWeight === '600' || fontWeight === '500') {
        fontFamily = 'Pretendard-SemiBold';
    } else if (fontWeight === 'medium') {
        fontFamily = 'Pretendard-Medium';
    }

    return (
        <Text
            {...otherProps}
            style={[style, { fontFamily, fontWeight: undefined }]}
        >
            {props.children}
        </Text>
    );
};
