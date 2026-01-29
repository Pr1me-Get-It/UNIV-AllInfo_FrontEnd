import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    gameOver?: boolean;
    text: string;
}

const Display: React.FC<Props> = ({ gameOver, text }) => (
    <View style={[styles.display, { borderColor: gameOver ? 'red' : '#333' }]}>
        <Text style={[styles.text, { color: gameOver ? 'red' : '#999' }]}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    display: {
        flex: 1,
        minHeight: 30,
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#333',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
        padding: 10,
    },
    text: {
        fontFamily: 'System', // Use default system font
        fontSize: 14,
        color: '#999',
    },
});

export default Display;
