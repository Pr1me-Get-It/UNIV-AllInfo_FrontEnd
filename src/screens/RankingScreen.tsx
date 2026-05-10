import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AppText from '../components/AppText';
import { COLORS } from '../constants/colors';
import { GAMES } from '../constants/games';
import { GameScore } from '../api/gameScore';
import { Ionicons } from '@expo/vector-icons';
import { useRankingLogic } from '../hooks/screens/useRankingLogic';

export default function RankingScreen() {
    const {
        selectedGameId,
        setSelectedGameId,
        scores,
        loading,
        myBestScore,
        isAdmin,
        handleDelete,
    } = useRankingLogic();

    const renderGameTab = (game: { id: number; name: string }) => (
        <TouchableOpacity
            key={game.id}
            style={[
                styles.tabItem,
                selectedGameId === game.id && styles.activeTabItem,
            ]}
            onPress={() => setSelectedGameId(game.id)}
        >
            <AppText
                style={[
                    styles.tabText,
                    selectedGameId === game.id && styles.activeTabText,
                ]}
            >
                {game.name}
            </AppText>
        </TouchableOpacity>
    );

    const getDisplayName = (item: GameScore) => {
        if (item.nickname) return item.nickname;
        if (item.name) return item.name; // For group rankings
        try {
            if (typeof item.metadata === 'string') {
                const parsed = JSON.parse(item.metadata);
                if (parsed && parsed.nickname) return parsed.nickname;
            } else if (typeof item.metadata === 'object' && item.metadata !== null) {
                if ((item.metadata as any).nickname) return (item.metadata as any).nickname;
            }
        } catch (e) {
            console.warn('Failed to parse metadata:', e);
        }
        return item.email ? item.email.split('@')[0] : 'Unknown';
    };

    const renderRankItem = ({ item, index }: { item: GameScore; index: number }) => {
        let rankIcon;
        if (index === 0) rankIcon = <Ionicons name="medal" size={24} color="#FFD700" />; // Gold
        else if (index === 1) rankIcon = <Ionicons name="medal" size={24} color="#C0C0C0" />; // Silver
        else if (index === 2) rankIcon = <Ionicons name="medal" size={24} color="#CD7F32" />; // Bronze
        else rankIcon = <AppText style={styles.rankText}>{index + 1}</AppText>;

        return (
            <View style={styles.rankItem}>
                <View style={styles.rankIconContainer}>{rankIcon}</View>
                <View style={styles.userInfo}>
                    <AppText style={styles.emailText} numberOfLines={1}>
                        {getDisplayName(item)}
                    </AppText>
                    {item.college && (
                        <AppText style={{ fontSize: 12, color: '#888' }} numberOfLines={1}>
                            {item.college} {item.department && `- ${item.department}`}
                        </AppText>
                    )}
                </View>
                <AppText style={styles.scoreText}>{(item.score || item.totalScore || 0).toLocaleString()}점</AppText>
                {isAdmin && item.id && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id!)}
                    >
                        <Ionicons name="trash-outline" size={20} color={'#EF4444'} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                {Object.values(GAMES).map((game) => renderGameTab(game))}
            </View>
            <View style={styles.warningContainer}>
                <AppText style={styles.warningText}>부적절한 닉네임시 랭킹이 삭제될 수 있습니다</AppText>
            </View>
            <View style={styles.myScoreContainer}>
                <AppText style={styles.myScoreLabel}>내 최고 점수</AppText>
                <AppText style={styles.myScoreValue}>{myBestScore.toLocaleString()}점</AppText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary || '#007AFF'} />
                </View>
            ) : (
                <FlatList
                    data={scores}
                    renderItem={renderRankItem}
                    keyExtractor={(item, index) => `${item.email}-${index}`}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>랭킹 데이터가 없습니다.</AppText>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    activeTabItem: {
        backgroundColor: COLORS.primary || '#007AFF', // Fallback color
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    warningText: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'center',
    },
    warningContainer: {
        padding: 1,
    },
    listContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    rankIconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    emailText: {
        fontSize: 16,
        color: '#333',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary || '#007AFF',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    myScoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F0F9FF', // Light blue background
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    myScoreLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0284C7', // Darker blue
    },
    myScoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary || '#007AFF',
    },
});
