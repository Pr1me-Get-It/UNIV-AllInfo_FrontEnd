import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface AppTextProps extends TextProps {
    children: React.ReactNode;
}

const AppText = React.forwardRef<Text, AppTextProps>(({ style, children, ...props }, ref) => {
    const flattenedStyle = StyleSheet.flatten(style) || {};
    let fontFamily = 'IBMPlexSansKR-Regular';
    const fontWeight = flattenedStyle.fontWeight;

    if (fontWeight === 'bold' || fontWeight === '700') {
        fontFamily = 'IBMPlexSansKR-Bold';
    } else if (fontWeight === '600') {
        fontFamily = 'IBMPlexSansKR-SemiBold';
    } else if (fontWeight === '500') {
        fontFamily = 'IBMPlexSansKR-Medium';
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
