import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { gameService, GameScore, deleteScore } from '../../api/gameScore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { GAMES } from '../../constants/games';

export const useRankingLogic = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { userId, gameBestScores, updateGameBestScore } = useAuth();
    const [selectedGameId, setSelectedGameId] = useState<number>(GAMES.FLAPPY_BIRD.id);
    const [scores, setScores] = useState<GameScore[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [myBestScore, setMyBestScore] = useState<number>(0);

    const isAdmin = false;

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
        if (!userId) return;
        try {
            const gameList = Object.values(GAMES);
            const game = gameList.find(g => g.id === gameId);
            if (!game) return;

            const bestResponse = await gameService.getMyRanking(game.type);

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
            const gameList = Object.values(GAMES);
            const game = gameList.find(g => g.id === gameId);
            if (!game) return;

            const response = await gameService.getGlobalRankings(game.type, 50);

            if (response.data && Array.isArray(response.data)) {
                const uniqueScoresMap = new Map<string, GameScore>();

                response.data.forEach((scoreItem: GameScore) => {
                    const key = scoreItem.userId ? String(scoreItem.userId) : (scoreItem.user_id ? String(scoreItem.user_id) : scoreItem.email || String(Math.random()));
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
        Alert.alert('준비중', '백엔드 개편으로 인해 준비중인 기능입니다.');
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
