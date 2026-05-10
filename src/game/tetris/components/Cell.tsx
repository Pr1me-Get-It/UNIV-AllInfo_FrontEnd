import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TETROMINOS } from '../tetrominos';

interface Props {
    type: keyof typeof TETROMINOS | 0;
}

const Cell: React.FC<Props> = ({ type }) => {
    const color = type ? TETROMINOS[type].color : '0, 0, 0';
    const [r, g, b] = color.split(', ');

    return (
        <View
            style={[
                styles.cell,
                {
                    borderWidth: type === 0 ? 0 : 4,
                    backgroundColor: type ? `rgba(${r}, ${g}, ${b}, 0.8)` : 'rgba(0, 0, 0, 0.1)',
                    borderTopColor: type ? `rgba(${r}, ${g}, ${b}, 1)` : 'transparent',
                    borderLeftColor: type ? `rgba(${r}, ${g}, ${b}, 1)` : 'transparent',
                    borderRightColor: type ? `rgba(${r}, ${g}, ${b}, 1)` : 'transparent',
                    borderBottomColor: type ? `rgba(${r}, ${g}, ${b}, 0.1)` : 'transparent',
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    cell: {
        width: '100%',
        aspectRatio: 1,
        borderStyle: 'solid',
    },
});

export default React.memo(Cell);
