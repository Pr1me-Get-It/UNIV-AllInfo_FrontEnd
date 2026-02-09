import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

import { useNavigation } from '@react-navigation/native';

export default function OthersScreen() {
    const navigation = useNavigation();
    const features = [
        {
            id: 'clocktower',
            title: '시계탑',
            icon: 'time-outline',
            description: '학교 시계탑 기능',
        },
        {
            id: 'tetris',
            title: '테트리스',
            icon: 'game-controller-outline',
            description: '추억의 테트리스 게임',
        },
        {
            id: 'applegame',
            title: '사과 게임',
            icon: 'grid-outline',
            description: '합이 10이 되도록 사과를 드래그하세요!',
        },
        {
            id: 'dancing',
            title: '교수님 몰래 춤추기',
            icon: 'musical-notes-outline',
            description: '스트레스 해소용 미니게임',
        },
    ];

    const handlePress = (featureTitle: string) => {
        if (featureTitle === '테트리스') {
            (navigation as any).navigate('Tetris');
        } else if (featureTitle === '사과 게임') {
            (navigation as any).navigate('AppleGame');
        } else {
            Alert.alert(featureTitle, '준비 중인 기능입니다.');
        }
    };

    return (
        <LinearGradient
            colors={[COLORS.lightPink, COLORS.white]}
            style={styles.container}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.8 }}
        >
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <AppText style={styles.headerTitle}>부가 기능</AppText>
                <View style={styles.grid}>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={styles.card}
                            onPress={() => handlePress(feature.title)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={feature.icon as any} size={32} color={COLORS.primary} />
                            </View>
                            <View style={styles.textContainer}>
                                <AppText style={styles.cardTitle}>{feature.title}</AppText>
                                <AppText style={styles.cardDescription}>{feature.description}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.arrowIcon} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff', // Removed for gradient
    },
    contentContainer: {
        padding: 20,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'column',
        gap: 15,
    },
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        // Elevation for Android
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(219, 31, 38, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
    },
    arrowIcon: {
        marginLeft: 10,
    },
});
