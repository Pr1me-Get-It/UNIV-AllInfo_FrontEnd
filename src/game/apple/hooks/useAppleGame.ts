import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 게임 설정
const COLS = 8;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 60) / COLS);
const TOTAL_TIME = 120; // 120초
const TARGET_SUM = 10;

export interface Apple {
    id: number;
    value: number;
    removed: boolean;
}

export const useAppleGame = () => {
    const [grid, setGrid] = useState<Apple[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [firstSelection, setFirstSelection] = useState<number | null>(null);
    const [rows, setRows] = useState(10);

    const insets = useSafeAreaInsets();

    // 화면 높이에 따른 동적 행 개수 계산
    useEffect(() => {
        const headerHeight = 60 + insets.top;
        const footerHeight = 80 + insets.bottom;
        const verticalPadding = 40;

        const availableHeight = SCREEN_HEIGHT - headerHeight - footerHeight - verticalPadding;
        const calculatedRows = Math.floor(availableHeight / CELL_SIZE);

        const finalRows = Math.max(8, Math.min(calculatedRows, 15));
        setRows(finalRows);
    }, [insets.top, insets.bottom]);

    // 게임 시작 시 초기화
    useEffect(() => {
        if (gameState === 'PLAYING' && rows > 0 && grid.length === 0) {
            initGame();
        }
    }, [gameState, rows]);

    // 타이머
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'PLAYING' && isPlaying && timeLeft > 0) {
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
    }, [gameState, isPlaying, timeLeft]);

    const initGame = () => {
        const newGrid = Array.from({ length: COLS * rows }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 9) + 1,
            removed: false,
        }));
        setGrid(newGrid);
        setScore(0);
        setTimeLeft(TOTAL_TIME);
        setIsPlaying(true);
        setSelectedIndices([]);
    };

    const startGame = () => {
        setGameState('PLAYING');
        initGame();
    };

    const endGame = () => {
        setIsPlaying(false);
    };

    const handleCellPress = (index: number) => {
        if (!isPlaying || gameState !== 'PLAYING') return;

        if (firstSelection === null) {
            setFirstSelection(index);
            setSelectedIndices([index]);
        } else {
            if (firstSelection === index) {
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

        setSelectedIndices(indices);

        if (sum === TARGET_SUM && count > 0) {
            setTimeout(() => {
                const newGrid = [...grid];
                indices.forEach((idx) => {
                    newGrid[idx].removed = true;
                });
                setGrid(newGrid);
                setScore((prev) => prev + count);
                setFirstSelection(null);
                setSelectedIndices([]);
            }, 200);
        } else {
            setTimeout(() => {
                setFirstSelection(null);
                setSelectedIndices([]);
            }, 300);
        }
    };

    return {
        grid,
        score,
        timeLeft,
        gameState,
        isPlaying,
        selectedIndices,
        firstSelection,
        rows,
        setGameState,
        startGame,
        initGame,
        handleCellPress,
        CELL_SIZE,
        COLS
    };
};
