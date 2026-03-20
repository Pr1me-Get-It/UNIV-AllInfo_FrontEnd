import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AppText from '../components/AppText';
import { COLORS } from '../constants/colors';
import { GAMES } from '../constants/games';
import { getTopScores, getBestScore, GameScore, deleteScore } from '../api/gameScore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AUTH_CONFIG } from '../constants/config';

export default function RankingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { userEmail, gameBestScores, updateGameBestScore } = useAuth(); // Added gameBestScores
    const [selectedGameId, setSelectedGameId] = useState<number>(GAMES.FLAPPY_BIRD.id);
    const [scores, setScores] = useState<GameScore[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [myBestScore, setMyBestScore] = useState<number>(0);

    const isAdmin = userEmail === AUTH_CONFIG.DEV_EMAIL;

    // 화면이 포커스될 때마다 데이터 갱신
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadScores(selectedGameId);
            // Local score priority
            if (gameBestScores && typeof gameBestScores[selectedGameId] === 'number') {
                setMyBestScore(gameBestScores[selectedGameId]);
            }
            loadMyBestScore(selectedGameId);
        });

        return unsubscribe;
    }, [navigation, selectedGameId, gameBestScores]);

    // 게임 탭 변경 시에도 갱신
    useEffect(() => {
        setMyBestScore(0);
        if (gameBestScores && typeof gameBestScores[selectedGameId] === 'number') {
            setMyBestScore(gameBestScores[selectedGameId]);
        }
        loadScores(selectedGameId);
        loadMyBestScore(selectedGameId);
    }, [selectedGameId, gameBestScores]);

    const loadMyBestScore = async (gameId: number) => {
        if (!userEmail) return;
        try {
            // Use getBestScore API
            const bestResponse = await getBestScore(gameId, userEmail);


            if (bestResponse.data && typeof bestResponse.data.bestScore === 'number') {
                const serverBest = bestResponse.data.bestScore;

                // Compare with local
                const localBest = gameBestScores[gameId] || 0;
                if (serverBest > localBest) {
                    setMyBestScore(serverBest);
                    // Sync to local context (without sending back to server ideally, but updateGameBestScore sends to server)
                    // For now, just update local display. 
                    // To strictly sync, we would need a pure 'setLocalBest' in context. 
                    // But 'updateGameBestScore' is fine, it will just re-save.
                    updateGameBestScore(gameId, serverBest, false);
                } else {
                    setMyBestScore(localBest);
                }
            } else {
                if (gameBestScores[gameId]) {
                    setMyBestScore(gameBestScores[gameId]);
                } else {

                    setMyBestScore(0);
                }
            }
        } catch (error: any) {
            // ... error handling
            if (gameBestScores[gameId]) {
                setMyBestScore(gameBestScores[gameId]);
            } else {
                setMyBestScore(0);
            }
        }
    };

    const loadScores = async (gameId: number) => {
        setLoading(true);
        try {
            const response = await getTopScores(gameId, 50); // Get top 50


            if (response.data && Array.isArray(response.data)) {
                // 중복 제거 로직: user_id(또는 email)별로 가장 높은 점수만 남김
                const uniqueScoresMap = new Map<string, GameScore>();

                response.data.forEach((scoreItem: GameScore) => {
                    const key = scoreItem.user_id ? String(scoreItem.user_id) : scoreItem.email;
                    if (!uniqueScoresMap.has(key)) {
                        uniqueScoresMap.set(key, scoreItem);
                    } else {
                        const existing = uniqueScoresMap.get(key)!;
                        if (scoreItem.score > existing.score) {
                            uniqueScoresMap.set(key, scoreItem);
                        }
                    }
                });

                // Map 값을 배열로 변환하고 점수 내림차순 정렬
                const sortedUniqueScores = Array.from(uniqueScoresMap.values()).sort((a, b) => b.score - a.score);


                setScores(sortedUniqueScores);
            }
            else if (response.data && (response.data as any).scores) { // Check if wrapped in object
                setScores((response.data as any).scores);
            } else {
                setScores([]);
            }
        } catch (error) {
            console.error('Failed to load ranking:', error);
            setScores([]);
        } finally {
            setLoading(false);
        }
    };

    // ... (handleDelete and renderGameTab remain same)

    const handleDelete = (scoreId: number) => {
        Alert.alert(
            '랭킹 삭제',
            '이 점수를 정말 삭제하시겠습니까? 복구할 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteScore(scoreId);
                            Alert.alert('삭제 완료', '점수가 삭제되었습니다.');
                            loadScores(selectedGameId); // Reload list
                        } catch (error) {
                            console.error('Failed to delete score:', error);
                            Alert.alert('오류', '삭제에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

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
                </View>
                <AppText style={styles.scoreText}>{item.score.toLocaleString()}점</AppText>
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
