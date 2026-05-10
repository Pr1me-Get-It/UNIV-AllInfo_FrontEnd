import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import AppText from '../../../components/AppText';
import { Apple } from '../hooks/useAppleGame';

interface AppleGridProps {
    grid: Apple[];
    selectedIndices: number[];
    firstSelection: number | null;
    onCellPress: (index: number) => void;
    cellSize: number;
    cols: number;
}

const AppleGrid = ({ grid, selectedIndices, firstSelection, onCellPress, cellSize, cols }: AppleGridProps) => {
    return (
        <View style={styles.gridContainer}>
            {grid.map((apple, index) => {
                const isSelected = selectedIndices.includes(index);
                const isFirstSelection = firstSelection === index;

                return (
                    <TouchableOpacity
                        key={apple.id}
                        activeOpacity={0.7}
                        onPress={() => onCellPress(index)}
                        style={[
                            styles.cell,
                            { width: cellSize, height: cellSize },
                            apple.removed && styles.removedCell,
                        ]}
                    >
                        {!apple.removed && (
                            <>
                                <Image
                                    source={require('../../../assets/applegame.webp')}
                                    style={[
                                        styles.appleImage,
                                        { width: cellSize - 2, height: cellSize - 2 },
                                    ]}
                                    contentFit="contain"
                                />
                                {(isSelected || isFirstSelection) && (
                                    <View style={styles.selectionOverlay} />
                                )}
                                <AppText style={[styles.appleText, (isSelected || isFirstSelection) && styles.selectedText]}>
                                    {apple.value}
                                </AppText>
                            </>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        position: 'relative',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    removedCell: {
        backgroundColor: 'transparent',
    },
    appleImage: {},
    appleText: {
        position: 'absolute',
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
        zIndex: 10,
        paddingTop: 0,
    },
    selectedText: {
        color: '#fff',
        transform: [{ scale: 1.2 }],
    },
    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        opacity: 0.5,
        borderRadius: 8,
        zIndex: 5,
    },
});

export default AppleGrid;
