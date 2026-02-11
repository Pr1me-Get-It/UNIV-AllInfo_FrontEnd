import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Platform,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { COLORS } from '../../constants/theme';
import CustomAlert from '../../components/ui/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 게임 설정
const COLS = 8;
// ROWS는 동적으로 계산됨
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 60) / COLS); // 좌우 여백(40) + 안전여유(20) 확실히 확보
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

    // 선택 상태
    const [firstSelection, setFirstSelection] = useState<number | null>(null);

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // 화면 높이에 따른 동적 행 개수 계산
    const [rows, setRows] = useState(10); // 초기값

    const [alertVisible, setAlertVisible] = useState(false);

    useEffect(() => {
        const headerHeight = 60 + insets.top; // 헤더 대략 높이 + 상단 여백
        const footerHeight = 80 + insets.bottom; // 푸터 대략 높이 + 하단 여백
        const verticalPadding = 40; // 위아래 여유 공간

        const availableHeight = SCREEN_HEIGHT - headerHeight - footerHeight - verticalPadding;
        const calculatedRows = Math.floor(availableHeight / CELL_SIZE);

        // 최소 8줄, 최대 15줄 정도로 제한 (너무 많거나 적지 않게)
        const finalRows = Math.max(8, Math.min(calculatedRows, 15));
        setRows(finalRows);
    }, [insets.top, insets.bottom]);

    useEffect(() => {
        if (rows > 0) initGame();
    }, [rows]);

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
        const newGrid = Array.from({ length: COLS * rows }, (_, i) => ({
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
        setAlertVisible(true);
    };

    const handleCellPress = (index: number) => {
        if (!isPlaying) return;

        if (firstSelection === null) {
            // 첫 번째 터치
            setFirstSelection(index);
            setSelectedIndices([index]);
        } else {
            // 두 번째 터치 - 사각형 생성 및 검사
            if (firstSelection === index) {
                // 같은 셀 터치 시 취소
                setFirstSelection(null);
                setSelectedIndices([]);
                return;
            }
            checkRectangleSelection(firstSelection, index);
        }
    };

    const checkRectangleSelection = (startIdx: number, endIdx: number) => {
        const startRow = Math.floor(startIdx / COLS);
        const startCol = startIdx % COLS;
        const endRow = Math.floor(endIdx / COLS);
        const endCol = endIdx % COLS;

        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);


        const indices: number[] = [];
        let sum = 0;
        let count = 0;

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const idx = r * COLS + c;
                indices.push(idx);
                const apple = grid[idx];
                if (!apple.removed) {
                    sum += apple.value;
                    count++;
                }
            }
        }

        // 선택 영역 시각화 (잠시 보여주기)
        setSelectedIndices(indices);

        if (sum === TARGET_SUM && count > 0) {
            // 성공
            setTimeout(() => {
                const newGrid = [...grid];
                indices.forEach((idx) => {
                    newGrid[idx].removed = true;
                });
                setGrid(newGrid);
                setScore((prev) => prev + count);
                setFirstSelection(null);
                setSelectedIndices([]);
            }, 200); // 0.2초 딜레이 후 삭제
        } else {
            // 실패
            setTimeout(() => {
                setFirstSelection(null);
                setSelectedIndices([]);
            }, 300); // 0.3초 후 초기화
        }
    };



    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0) }]}>
                {/* Back Button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>

                <View style={styles.scoreContainer}>
                    <AppText style={styles.label}>점수</AppText>
                    <AppText style={styles.value}>{score}</AppText>
                </View>
                <AppText style={styles.title}>두쫀쿠 게임</AppText>
                <View style={styles.scoreContainer}>
                    <AppText style={styles.label}>남은시간</AppText>
                    <AppText style={[styles.value, timeLeft <= 10 && styles.warning]}>
                        {timeLeft}
                    </AppText>
                </View>
            </View>

            <View
                style={styles.gridContainer}
            >
                {grid.map((apple, index) => {
                    const isSelected = selectedIndices.includes(index);
                    const isFirstSelection = firstSelection === index;

                    return (
                        <TouchableOpacity
                            key={apple.id}
                            activeOpacity={0.7}
                            onPress={() => handleCellPress(index)}
                            style={[
                                styles.cell,
                                { width: CELL_SIZE, height: CELL_SIZE },
                                isSelected && styles.selectedCell, // 선택된 셀 스타일 적용
                                isFirstSelection && { borderColor: 'blue', borderWidth: 2 }, // 첫 터치 강조
                                apple.removed && styles.removedCell,
                            ]}
                        >
                            {!apple.removed && (
                                <>
                                    <Image
                                        source={require('../../assets/applegame.png')}
                                        style={[
                                            styles.appleImage,
                                            { width: CELL_SIZE - 2, height: CELL_SIZE - 2 },
                                            isSelected && styles.selectedImage
                                        ]}
                                        resizeMode="contain"
                                    />
                                    <AppText style={[styles.appleText, isSelected && styles.selectedText]}>
                                        {apple.value}
                                    </AppText>
                                </>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={initGame}>
                    <Ionicons name="refresh" size={24} color="white" />
                    <AppText style={styles.buttonText}>Reset</AppText>
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={alertVisible}
                title="게임 종료"
                message={`최종 점수: ${score}점`}
                onClose={() => setAlertVisible(false)}
                buttons={[
                    {
                        text: '다시 하기',
                        onPress: () => {
                            setAlertVisible(false);
                            initGame();
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: '#f8f9fa',
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginLeft: -32, // Center title by offsetting back button width approx
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
        // borderWidth: 1, // Remove border to avoid layout wrapping issues
        // borderColor: '#eee',
        position: 'relative', // For absolute positioning of selection box
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 0.5, // Remove border for cleaner look with icons
        // borderColor: '#f0f0f0',
    },
    selectedCell: {
        // backgroundColor: 'rgba(219, 31, 38, 0.1)', // Icon handles color change
    },
    removedCell: {
        backgroundColor: 'transparent',
    },
    appleImage: {
        // Shadow removed as outline doesn't need it as much, or keep it subtle
    },
    selectedImage: {
        opacity: 0.8,
    },
    appleText: {
        position: 'absolute',
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff', // White text on red apple
        zIndex: 1,
        // textAlign: 'center', 
        paddingTop: 0,
    },
    selectedText: {
        color: '#fff',
        transform: [{ scale: 1.2 }],
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
