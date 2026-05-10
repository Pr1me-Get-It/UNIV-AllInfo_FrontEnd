import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Matter from 'matter-js';
import { Image } from 'expo-image';
import SimpleGameEngine from './components/GameEngine';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Ionicons or similar
import { Physics } from './systems/Physics';
import Entities from './entities';
import { Images } from './assets/images';
import AppText from '../../components/AppText'; // Adjust path if needed
import { useAuth } from '../../context/AuthContext';
// Removed saveScore, getBestScore since AuthContext handles it now

const systems = [Physics];
const GAME_ID = 1; // Flappy Bird Game ID

const FlappyBirdScreen = () => {
    const [running, setRunning] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [isRestartable, setIsRestartable] = useState(false); // Restart delay state
    const gameEngineRef = React.useRef<any>(null);
    const [currentPoints, setCurrentPoints] = useState(0);
    const scoreRef = React.useRef(0); // Use ref to track score without stale closures
    const [myBestScore, setMyBestScore] = useState(0); // State to store best score
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { userEmail, nickname, gameBestScores, updateGameBestScore } = useAuth(); // Get gameBestScores and update function

    const initialEntities = React.useMemo(() => Entities(), []);

    useEffect(() => {
        setRunning(true);
        // Load best score from Context
        if (gameBestScores && typeof gameBestScores[GAME_ID] === 'number') {
            setMyBestScore(gameBestScores[GAME_ID]);
        }
    }, [gameBestScores]);

    const onEvent = React.useCallback((e: any) => {
        if (e.type === 'game_over') {
            // runningRef를 즉시 false로 설정하여 게임 루프가 다음 프레임을 실행하지 않도록 함
            if (gameEngineRef.current?.stopLoop) {
                gameEngineRef.current.stopLoop();
            }
            setRunning(false);
            setIsRestartable(false); // Lock restarting immediately
            const finalScore = scoreRef.current; // Read from ref

            // Context를 통해 로컬/서버 동시 업데이트
            updateGameBestScore(GAME_ID, finalScore);

            // 로컬 상태 업데이트 (화면 표시용) - Context가 업데이트되면 useEffect에서 반영되지만 즉각 반응을 위해
            if (finalScore > myBestScore) {
                setMyBestScore(finalScore);
            }

            // Enable restart after 0.25 second
            setTimeout(() => {
                setIsRestartable(true);
            }, 250);

        } else if (e.type === 'score') {
            scoreRef.current += 1; // Update ref directly
            setCurrentPoints(scoreRef.current);
        } else if (e.type === 'game_start') {
            setGameStarted(true);
            scoreRef.current = 0; // Reset ref
            setCurrentPoints(0);
        }
    }, [myBestScore, updateGameBestScore]); // Add updateGameBestScore

    const resetGame = () => {
        if (!isRestartable) return; // Prevent reset if not ready

        if (gameEngineRef.current) {
            // 이전 충돌 리스너 제거 (누적 방지)
            const currentEntities = gameEngineRef.current.entities;
            if (currentEntities?.physics?.engine && currentEntities?.physics?.collisionHandler) {
                Matter.Events.off(
                    currentEntities.physics.engine,
                    'collisionStart',
                    currentEntities.physics.collisionHandler
                );
            }
            gameEngineRef.current.swap(Entities());
        }
        setRunning(true);
        setGameStarted(false);
        setCurrentPoints(0);
        scoreRef.current = 0; // Reset ref
    };

    return (
        <View style={styles.container}>
            <Image source={Images.background} style={styles.backgroundImage} contentFit="fill" />

            <SimpleGameEngine
                ref={gameEngineRef}
                style={styles.gameContainer}
                systems={systems}
                entities={initialEntities}
                running={running}
                onEvent={onEvent}>
                <StatusBar hidden={true} />
            </SimpleGameEngine>

            {!gameStarted && running && (
                <View style={styles.fullScreenButton} pointerEvents="none">
                    <View style={styles.scoreContainer}>
                        <AppText style={styles.gameOverText}>Ready</AppText>
                        <AppText style={styles.gameOverSubText}>Touch to Start</AppText>
                    </View>
                </View>
            )}

            {!running && (
                <View style={styles.fullScreenButton}>
                    <TouchableOpacity
                        style={styles.fullScreenButton}
                        onPress={resetGame}
                        disabled={!isRestartable} // Disable touch interaction visually/mechanically
                    >
                        <View style={styles.scoreContainer}>
                            <AppText style={styles.gameOverText}>Game Over</AppText>
                            <AppText
                                style={[
                                    styles.gameOverSubText,
                                    { opacity: isRestartable ? 1 : 0.4 } // Dim text while disabled
                                ]}
                            >
                                Touch to Restart
                            </AppText>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.header} pointerEvents="box-none">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <AppText style={styles.scoreText}>{currentPoints}</AppText>
                <AppText style={styles.bestScoreText}>Best: {myBestScore}</AppText>
            </View>

            {/* License Attribution */}
            <AppText style={styles.licenseText}>Background designed by stockgiu / Freepik</AppText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
    },
    gameContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    fullScreenButton: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    scoreContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameOverText: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    gameOverSubText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 50,
        elevation: 50, // Android를 위한 높이 설정
    },
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        zIndex: 100,
        elevation: 100,
    },
    scoreText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ffffffff',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        top: 0,
    },
    bestScoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffffff',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        top: 50, // Position below current score
    },
    licenseText: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        zIndex: 5,
    }
});

export default FlappyBirdScreen;
