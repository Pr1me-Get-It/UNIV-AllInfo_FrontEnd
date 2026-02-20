import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom Hooks
import { useInterval } from '../game/tetris/hooks/useInterval';
import { usePlayer } from '../game/tetris/hooks/usePlayer';
import { useStage } from '../game/tetris/hooks/useStage';
import { useGameStatus } from '../game/tetris/hooks/useGameStatus';

// Components
import Cell from '../game/tetris/components/Cell';
import Display from '../game/tetris/components/Display';
import CustomAlert from '../components/ui/CustomAlert';

// Helpers
import { createStage, checkCollision } from '../game/tetris/gameHelpers';
import { useAuth } from '../context/AuthContext'; // Added import
import { GAMES } from '../constants/games'; // Added import

const { width, height } = Dimensions.get('window');
const BOARD_WIDTH_RATIO = 0.65; // Width constraint
const BOARD_HEIGHT_RATIO = 0.75; // Height constraint

const CELL_SIZE_W = (width * BOARD_WIDTH_RATIO) / 12; // 12 Columns
const CELL_SIZE_H = (height * BOARD_HEIGHT_RATIO) / 20; // 20 Rows

const CELL_SIZE = Math.min(CELL_SIZE_W, CELL_SIZE_H);

export default function TetrisScreen() {
    const insets = useSafeAreaInsets();
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);

    const { userEmail, gameBestScores, updateGameBestScore } = useAuth(); // Added useAuth
    const [myBestScore, setMyBestScore] = useState(0);
    const GAME_ID = GAMES.TETRIS.id;

    const { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer, nextTetromino } = usePlayer();
    const { stage, setStage, rowsCleared } = useStage(player, resetPlayer);
    const { score, setScore, rows, setRows, level, setLevel } = useGameStatus(rowsCleared);

    // Load local best score
    React.useEffect(() => {
        if (gameBestScores && typeof gameBestScores[GAME_ID] === 'number') {
            setMyBestScore(gameBestScores[GAME_ID]);
        }
    }, [gameBestScores]);

    const movePlayer = (dir: number) => {
        if (!checkCollision(player, stage, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
        }
    };

    // Calculate dynamic CELL_SIZE
    const screenHeight = height;
    const screenWidth = width;

    // Layout Constants
    const HEADER_HEIGHT = 40; // Reduced from 60
    const CONTROLS_HEIGHT = 220; // Reduced from 250
    const PADDING_V = 20; // Reduced from 40
    const TAB_BAR_HEIGHT = 50; // Approximate TabBar height

    // Available height for the board
    const availableHeight = screenHeight - insets.top - insets.bottom - HEADER_HEIGHT - CONTROLS_HEIGHT - PADDING_V - TAB_BAR_HEIGHT;
    const availableWidth = screenWidth * 0.98; // Increased from 95% to 98%

    // Board Dimensions
    const BOARD_COLS = 12;
    const BOARD_ROWS = 20;

    // Calculate max cell size that fits both width and height constraints
    const cellSizeByHeight = availableHeight / BOARD_ROWS;
    const cellSizeByWidth = (availableWidth * 0.70) / BOARD_COLS; // Increased width ratio from 0.65 to 0.70

    // Use the smaller of the two to ensure fit
    const CELL_SIZE = Math.min(cellSizeByHeight, cellSizeByWidth, 35); // Max cap increased to 35
    // Min cap could be added but usually not needed as mobile screens are small

    const startGame = () => {
        // Reset everything
        setStage(createStage());
        setDropTime(1000);
        resetPlayer();
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);
    };

    const drop = () => {
        // Increase level when player has cleared 10 rows
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            // Also increase speed
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            // Game Over
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                setAlertVisible(true);

                // Save Score
                updateGameBestScore(GAME_ID, score);
                if (score > myBestScore) {
                    setMyBestScore(score);
                }
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    };

    // Custom hook by Dan Abramov
    useInterval(() => {
        drop();
    }, dropTime);

    const getDropTime = (lvl: number) => {
        return 1000 / (lvl + 1) + 200;
    };

    const dropPlayer = () => {
        setDropTime(null);
        drop();
    };

    const startFastDrop = () => {
        setDropTime(50);
    };

    const stopFastDrop = () => {
        setDropTime(getDropTime(level));
    };

    const move = ({ x, y }: { x: number, y: number }) => {
        if (!gameOver) {
            if (x !== 0) {
                movePlayer(x);
            }
        }
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
            <View style={styles.contentContainer}>
                <View style={styles.gameContainer}>
                    {/* Game Board */}
                    <View style={[styles.tetrisWrapper, {
                        width: CELL_SIZE * BOARD_COLS + 4, // border width accounting 
                        height: CELL_SIZE * BOARD_ROWS + 4
                    }]}>
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            width: CELL_SIZE * BOARD_COLS,
                            height: CELL_SIZE * BOARD_ROWS,
                        }}>
                            {stage.map((row, y) =>
                                row.map((cell, x) => (
                                    <View key={`${y}-${x}`} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                                        <Cell type={cell[0]} />
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Game Over Overlay */}
                        {gameOver && (
                            <View style={styles.gameOverOverlay}>
                                <AppText style={styles.gameOverText}>Game Over</AppText>
                                <AppText style={styles.finalScoreText}>Score: {score}</AppText>
                                <TouchableOpacity style={styles.retryButton} onPress={startGame}>
                                    <AppText style={styles.retryButtonText}>Try Again</AppText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Info Display (Score, Rows, Level) - Right Side */}
                    <View style={styles.statsContainer}>
                        <Display text={`Best\n${myBestScore}`} />
                        <Display text={`점수\n${score}`} />
                        <Display text={`레벨\n${level}`} />

                        {/* Next Block Display */}
                        <View style={styles.nextBlockContainer}>
                            <AppText style={styles.nextBlockText}>Next</AppText>
                            <View style={styles.nextBlockGrid}>
                                {nextTetromino.map((row, y) => (
                                    <View key={y} style={{ flexDirection: 'row' }}>
                                        {row.map((cell, x) => (
                                            <View key={x} style={{ width: CELL_SIZE * 0.6, height: CELL_SIZE * 0.6 }}>
                                                {/* Only render actual blocks, not empty space */}
                                                <Cell type={cell as any} />
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {/* Start Button */}
                    {!dropTime && !gameOver ? (
                        <TouchableOpacity style={styles.startButton} onPress={startGame}>
                            <AppText style={styles.startButtonText}>게임시작</AppText>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {/* Directional Controls */}
                            <View style={styles.controlRow}>
                                <TouchableOpacity
                                    style={[styles.controlBtn, styles.rotateBtn]}
                                    onPress={() => playerRotate(stage, 1)}
                                >
                                    <Ionicons name="refresh" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.controlRow}>
                                <TouchableOpacity
                                    style={styles.controlBtn}
                                    onPress={() => move({ x: -1, y: 0 })}
                                >
                                    <Ionicons name="arrow-back" size={28} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.controlBtn, styles.dropBtn]}
                                    onPressIn={startFastDrop}
                                    onPressOut={stopFastDrop}
                                >
                                    <Ionicons name="arrow-down" size={28} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.controlBtn}
                                    onPress={() => move({ x: 1, y: 0 })}
                                >
                                    <Ionicons name="arrow-forward" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                <CustomAlert
                    visible={alertVisible}
                    title="Game Over!"
                    message={`Score: ${score}`}
                    onClose={() => setAlertVisible(false)}
                    buttons={[
                        {
                            text: '다시 하기',
                            onPress: () => {
                                setAlertVisible(false);
                                startGame();
                            }
                        },
                        {
                            text: '닫기',
                            onPress: () => setAlertVisible(false),
                            style: 'cancel'
                        }
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Slightly softer black
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center', // Center vertically
        alignItems: 'center',
    },
    gameContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    tetrisWrapper: {
        position: 'relative',
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#000',
        borderRadius: 8, // Soft corners
        overflow: 'hidden',
    },
    // tetrisBoard style removed, inline style used for dynamic size
    statsContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        marginLeft: 15,
        width: 80,
        gap: 10, // Compact gap
    },
    nextBlockContainer: {
        marginTop: 10,
        alignItems: 'center',
        backgroundColor: '#1E1E1E', // Distinct card background
        padding: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    nextBlockText: {
        color: '#ccc',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 1,
    },
    nextBlockGrid: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    controls: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        height: 180, // Fixed height for controls
    },
    controlRow: {
        flexDirection: 'row',
        gap: 20, // Wider spacing
        marginBottom: 15,
        alignItems: 'center',
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassmorphism-ish
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    rotateBtn: {
        backgroundColor: 'rgba(90, 24, 154, 0.3)', // Subtle Purple tint
        borderColor: '#5A189A',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    dropBtn: {
        width: 70, // Main action larger
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(219, 31, 37, 0.2)', // App Primary Red tint
        borderColor: '#db1f25ff',
        borderWidth: 2,
    },
    startButton: {
        marginTop: 30,
        paddingVertical: 15,
        paddingHorizontal: 50,
        backgroundColor: '#db1f25ff', // App Primary Red
        borderRadius: 30,
        shadowColor: '#db1f25ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    gameOverText: {
        fontSize: 30,
        fontWeight: '900',
        color: '#db1f25ff',
        marginBottom: 10,
        textShadowColor: 'rgba(219, 31, 37, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    finalScoreText: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
        fontWeight: '300',
    },
    retryButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        backgroundColor: '#fff',
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#db1f25ff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
