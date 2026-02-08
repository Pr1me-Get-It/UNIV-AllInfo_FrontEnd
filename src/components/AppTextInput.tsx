import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface AppTextInputProps extends TextInputProps { }

const AppTextInput: React.FC<AppTextInputProps> = ({ style, ...props }) => {
    return (
        <TextInput style={[styles.default, style]} {...props} />
    );
};

const styles = StyleSheet.create({
    default: {
        fontFamily: 'IBMPlexSansKR-Regular',
    },
});

export default AppTextInput;
