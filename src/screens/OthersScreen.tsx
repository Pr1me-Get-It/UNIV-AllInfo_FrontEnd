import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from '../utils/responsive';

import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SPACING = 8; // Reduced spacing slightly to allow more room for icons
const CARD_WIDTH = (width - 40 - SPACING * 3) / 4; // 4 items per row

export default function OthersScreen() {
    const navigation = useNavigation();
    const features = [
        {
            id: 'clocktower',
            title: '시계탑',
            icon: 'time-outline',
            color: '#3B82F6', // Blue
            bgColor: '#EFF6FF',
        },
        {
            id: 'tetris',
            title: '테트리스',
            icon: 'game-controller-outline',
            color: '#8B5CF6', // Purple
            bgColor: '#F5F3FF',
        },
        {
            id: 'applegame',
            title: '두쫀쿠', // Shortened name for compact view
            icon: 'grid-outline',
            color: '#10B981', // Emerald
            bgColor: '#ECFDF5',
        },
        {
            id: 'flappybird',
            title: '플래피', // Shortened name
            icon: 'rocket-outline',
            color: '#EF4444', // Red
            bgColor: '#FEF2F2',
        },
    ];

    const handlePress = (featureTitle: string) => {
        if (featureTitle === '테트리스') {
            (navigation as any).navigate('Tetris');
        } else if (featureTitle.includes('두쫀쿠')) {
            (navigation as any).navigate('AppleGame');
        } else if (featureTitle.includes('플래피')) {
            (navigation as any).navigate('FlappyBird');
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
                            <View style={[styles.iconContainer, { backgroundColor: feature.bgColor }]}>
                                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                            </View>
                            <AppText style={styles.cardTitle} numberOfLines={1}>{feature.title}</AppText>
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: SPACING,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: 'transparent', // Remove card background for icon-like look
        // borderRadius: 12,
        // paddingVertical: 10,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        // Remove shadow/border for cleaner icon look
        borderWidth: 0,
        elevation: 0,
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
});
