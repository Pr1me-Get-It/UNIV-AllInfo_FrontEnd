import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 게임 설정
const COLS = 10;
const ROWS = 17; // 모바일 비율에 맞춰 10x17로 조정 (원본은 17x10)
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / COLS); // 좌우 여백 고려
const TOTAL_TIME = 120; // 120초
const TARGET_SUM = 10;

interface Apple {
    id: number;
    value: number;
    removed: boolean;
}

const AppleGameScreen = () => {
    const [grid, setGrid] = useState<Apple[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // 제스처 처리를 위한 ref
    const containerRef = useRef<View>(null);
    const containerLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // 드래그 상태
    const startPos = useSharedValue({ x: -1, y: -1 });
    const currentPos = useSharedValue({ x: -1, y: -1 });
    const isDragging = useSharedValue(false);

    useEffect(() => {
        initGame();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

    const initGame = () => {
        const newGrid = Array.from({ length: COLS * ROWS }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 9) + 1, // 1~9
            removed: false,
        }));
        setGrid(newGrid);
        setScore(0);
        setTimeLeft(TOTAL_TIME);
        setIsPlaying(true);
        setSelectedIndices([]);
    };

    const endGame = () => {
        setIsPlaying(false);
        Alert.alert('게임 종료', `최종 점수: ${score}점`, [
            { text: '다시 하기', onPress: initGame },
            { text: '닫기' },
        ]);
    };

    const getIndexFromCoords = (x: number, y: number) => {
        // 컨테이너 내부 좌표 기준
        // x, y는 e.x, e.y (제스처 이벤트)
        if (x < 0 || y < 0) return -1;

        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);

        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            return row * COLS + col;
        }
        return -1;
    };

    const updateSelection = (start: { x: number; y: number }, current: { x: number; y: number }) => {
        const startIdx = getIndexFromCoords(start.x, start.y);
        const endIdx = getIndexFromCoords(current.x, current.y);

        if (startIdx === -1 || endIdx === -1) return;

        const startRow = Math.floor(startIdx / COLS);
        const startCol = startIdx % COLS;
        const endRow = Math.floor(endIdx / COLS);
        const endCol = endIdx % COLS;

        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const indices: number[] = [];
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                indices.push(r * COLS + c);
            }
        }

        // 최적화: 변경사항이 있을 때만 상태 업데이트
        setSelectedIndices(prev => {
            if (prev.length === indices.length && prev.every((val, index) => val === indices[index])) {
                return prev;
            }
            return indices;
        });
    };

    const checkSelection = () => {
        if (selectedIndices.length === 0) return;

        // 이미 제거된 사과가 포함되어 있는지 확인? 게임 규칙상 빈칸도 드래그 가능할 수 있지만,
        // 보통 빈칸은 0이나 무시 처리. 여기서는 removed된 것은 value 계산에서 제외하거나,
        // 드래그 영역에 포함되면 그냥 0으로 취급.

        let sum = 0;
        let count = 0;
        const selectedApples: number[] = [];

        selectedIndices.forEach((idx) => {
            const apple = grid[idx];
            if (!apple.removed) {
                sum += apple.value;
                count++;
                selectedApples.push(idx);
            }
        });

        if (sum === TARGET_SUM && count > 0) {
            // 성공!
            const newGrid = [...grid];
            selectedApples.forEach((idx) => {
                newGrid[idx].removed = true;
            });
            setGrid(newGrid);
            setScore((prev) => prev + count); // 사과 개수만큼 점수
        }

        // 선택 초기화
        setSelectedIndices([]);
    };

    // Wrapper function to call updateSelection from worklet
    const runUpdateSelection = (start: { x: number, y: number }, curr: { x: number, y: number }) => {
        updateSelection(start, curr);
    };

    // Wrapper for checkSelection
    const runCheckSelection = () => {
        checkSelection();
    };

    const panGesture = Gesture.Pan()
        .onStart((e) => {
            startPos.value = { x: e.x, y: e.y };
            currentPos.value = { x: e.x, y: e.y };
            isDragging.value = true;
            runOnJS(runUpdateSelection)({ x: e.x, y: e.y }, { x: e.x, y: e.y });
        })
        .onUpdate((e) => {
            currentPos.value = { x: e.x, y: e.y };
            runOnJS(runUpdateSelection)({ x: startPos.value.x, y: startPos.value.y }, { x: e.x, y: e.y });
        })
        .onEnd(() => {
            isDragging.value = false;
            runOnJS(runCheckSelection)();
        });

    const animatedSelectionStyle = useAnimatedStyle(() => {
        if (!isDragging.value) return { display: 'none' };

        const x1 = Math.min(startPos.value.x, currentPos.value.x);
        const y1 = Math.min(startPos.value.y, currentPos.value.y);
        const x2 = Math.max(startPos.value.x, currentPos.value.x);
        const y2 = Math.max(startPos.value.y, currentPos.value.y);

        return {
            position: 'absolute',
            left: x1,
            top: y1,
            width: x2 - x1,
            height: y2 - y1,
            borderWidth: 2,
            borderColor: 'blue', // 나중에 합이 10이면 빨강으로 바꾸는 로직 추가 가능 (JS 측에서 계산 필요)
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            display: 'flex',
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.scoreContainer}>
                    <AppText style={styles.label}>SCORE</AppText>
                    <AppText style={styles.value}>{score}</AppText>
                </View>
                <AppText style={styles.title}>🍎 Apple Game</AppText>
                <View style={styles.scoreContainer}>
                    <AppText style={styles.label}>TIME</AppText>
                    <AppText style={[styles.value, timeLeft <= 10 && styles.warning]}>
                        {timeLeft}
                    </AppText>
                </View>
            </View>

            <GestureDetector gesture={panGesture}>
                <View
                    style={styles.gridContainer}
                    ref={containerRef}
                    onLayout={(e) => {
                        const { x, y, width, height } = e.nativeEvent.layout;
                        containerLayout.current = { x, y, width, height };
                    }}
                >
                    {grid.map((apple, index) => {
                        const isSelected = selectedIndices.includes(index);
                        return (
                            <View
                                key={apple.id}
                                style={[
                                    styles.cell,
                                    { width: CELL_SIZE, height: CELL_SIZE },
                                    isSelected && styles.selectedCell,
                                    apple.removed && styles.removedCell,
                                ]}
                            >
                                {!apple.removed && (
                                    <AppText style={[styles.appleText, isSelected && styles.selectedText]}>
                                        {apple.value}
                                    </AppText>
                                )}
                            </View>
                        );
                    })}

                    <Animated.View style={[animatedSelectionStyle, { pointerEvents: 'none' }]} />
                </View>
            </GestureDetector>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={initGame}>
                    <Ionicons name="refresh" size={24} color="white" />
                    <AppText style={styles.buttonText}>Reset</AppText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    scoreContainer: {
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    warning: {
        color: 'red',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#eee',
        position: 'relative', // For absolute positioning of selection box
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#f0f0f0',
    },
    selectedCell: {
        backgroundColor: 'rgba(219, 31, 38, 0.1)',
    },
    removedCell: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    appleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    selectedText: {
        color: COLORS.PRIMARY,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: 'bold',
    },
});

export default AppleGameScreen;
