import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import AppText from '../AppText';
import { COLORS } from '../../constants/colors';
import { MOCK_MEALS, MealMenu } from '../../data/mockHomeData';
import { moderateScale } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; // 75% of screen width

export default function MealWidget() {
    const isApiReady = false;

    const renderMealCard = (meal: MealMenu) => {
        return (
            <TouchableOpacity key={meal.id} style={styles.card} activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="restaurant" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <AppText style={styles.restaurantName}>{meal.restaurantName}</AppText>
                    </View>
                    <View style={styles.timeBadge}>
                        <AppText style={styles.timeBadgeText}>{meal.time}</AppText>
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    {meal.menus.map((menuItem, index) => (
                        <AppText key={index} style={styles.menuItem}>
                            • {menuItem}
                        </AppText>
                    ))}
                </View>

                <View style={styles.cardFooter}>
                    <AppText style={styles.price}>{meal.price}</AppText>
                    {meal.isSoldOut && <AppText style={styles.soldOut}>품절</AppText>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>오늘의 학식</AppText>
                <TouchableOpacity style={styles.moreButton}>
                    <AppText style={styles.moreButtonText}>전체보기</AppText>
                    <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {isApiReady ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    snapToInterval={CARD_WIDTH + 16} // card width + margin
                    decelerationRate="fast"
                >
                    {MOCK_MEALS.map(renderMealCard)}
                </ScrollView>
            ) : (
                <View style={styles.placeholderCard}>
                    <Ionicons name="restaurant-outline" size={32} color="#ccc" />
                    <AppText style={styles.placeholderText}>학식 정보 준비 중입니다</AppText>
                    <AppText style={styles.placeholderSubText}>차후 업데이트 예정입니다.</AppText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: moderateScale(20, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    moreButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moreButtonText: {
        fontSize: moderateScale(13, 0.3),
        color: '#6B7280',
        marginRight: 2,
    },
    scrollContent: {
        paddingLeft: 4,
        paddingRight: 20,
        paddingBottom: 4,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginRight: 16,
        // Add shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    restaurantName: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: '#333',
    },
    timeBadge: {
        backgroundColor: 'rgba(219, 31, 38, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timeBadgeText: {
        fontSize: moderateScale(12, 0.3),
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    menuContainer: {
        marginBottom: 16,
    },
    menuItem: {
        fontSize: moderateScale(14, 0.3),
        color: '#4B5563',
        marginBottom: 6,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    soldOut: {
        fontSize: moderateScale(13, 0.3),
        color: '#EF4444',
        fontWeight: 'bold',
    },
    placeholderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 40,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    placeholderText: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    placeholderSubText: {
        fontSize: moderateScale(13, 0.3),
        color: '#999',
        marginTop: 6,
    },
});
