import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getTopScores, getBestScore, GameScore, deleteScore } from '../../api/gameScore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { AUTH_CONFIG } from '../../constants/config';
import { GAMES } from '../../constants/games';

export const useRankingLogic = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { userEmail, gameBestScores, updateGameBestScore } = useAuth();
    const [selectedGameId, setSelectedGameId] = useState<number>(GAMES.FLAPPY_BIRD.id);
    const [scores, setScores] = useState<GameScore[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [myBestScore, setMyBestScore] = useState<number>(0);

    const isAdmin = userEmail === AUTH_CONFIG.DEV_EMAIL;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadScores(selectedGameId);
            if (gameBestScores && typeof gameBestScores[selectedGameId] === 'number') {
                setMyBestScore(gameBestScores[selectedGameId]);
            }
            loadMyBestScore(selectedGameId);
        });

        return unsubscribe;
    }, [navigation, selectedGameId, gameBestScores]);

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
            const bestResponse = await getBestScore(gameId, userEmail);

            if (bestResponse.data && typeof bestResponse.data.bestScore === 'number') {
                const serverBest = bestResponse.data.bestScore;
                const localBest = gameBestScores[gameId] || 0;
                
                if (serverBest > localBest) {
                    setMyBestScore(serverBest);
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
            const response = await getTopScores(gameId, 50);

            if (response.data && Array.isArray(response.data)) {
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

                const sortedUniqueScores = Array.from(uniqueScoresMap.values()).sort((a, b) => b.score - a.score);
                setScores(sortedUniqueScores);
            } else if (response.data && (response.data as any).scores) {
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
                            loadScores(selectedGameId);
                        } catch (error) {
                            console.error('Failed to delete score:', error);
                            Alert.alert('오류', '삭제에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    return {
        selectedGameId,
        setSelectedGameId,
        scores,
        loading,
        myBestScore,
        isAdmin,
        handleDelete,
    };
};
