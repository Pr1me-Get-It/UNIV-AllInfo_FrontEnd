import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from '../utils/responsive';
import { useOthersLogic } from '../hooks/screens/useOthersLogic';

export default function OthersScreen() {
    const { features, games, handlePress } = useOthersLogic();

    const renderGrid = (items: any[]) => (
        <View style={styles.gridWrapper}>
            <View style={styles.grid}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        onPress={() => handlePress(item.title, item.id)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                            <Ionicons name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <AppText style={styles.cardTitle} numberOfLines={1}>{item.title}</AppText>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={[COLORS.lightPink, COLORS.white]}
            style={styles.container}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.8 }}
        >
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <AppText style={styles.headerTitle}>부가 기능</AppText>
                {renderGrid(features)}

                <View style={styles.divider} />

                <AppText style={styles.headerTitle}>게임</AppText>
                {renderGrid(games)}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: moderateScale(24, 0.3),
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 20,
    },
    gridWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    card: {
        width: '25%',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 5,
    },
    iconContainer: {
        width: moderateScale(56, 0.3), // Slightly larger
        height: moderateScale(56, 0.3),
        borderRadius: 18, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        // Add shadow to icon itself
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: moderateScale(13, 0.3), // Increased from 12
        fontWeight: 'bold', // Changed to bold
        color: '#374151', // Slightly darker gray
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB', // Light gray
        marginVertical: 20,
        width: '100%',
    },
});
