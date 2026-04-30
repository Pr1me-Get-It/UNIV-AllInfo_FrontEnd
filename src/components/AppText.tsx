import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface AppTextProps extends TextProps {
    children: React.ReactNode;
}

const AppText = React.forwardRef<Text, AppTextProps>(({ style, children, ...props }, ref) => {
    const flattenedStyle = StyleSheet.flatten(style) || {};
    let fontFamily = 'Pretendard-Regular';
    const fontWeight = flattenedStyle.fontWeight;

    if (fontWeight === 'bold' || fontWeight === '700') {
        fontFamily = 'Pretendard-Bold';
    } else if (fontWeight === '600') {
        fontFamily = 'Pretendard-SemiBold';
    } else if (fontWeight === '500') {
        fontFamily = 'Pretendard-Medium';
    }

    return (
        <Text ref={ref} style={[styles.default, style, { fontFamily, fontWeight: undefined }]} {...props}>
            {children}
        </Text>
    );
});

const styles = StyleSheet.create({
    default: {
        color: '#000',
    },
});

export default AppText;
