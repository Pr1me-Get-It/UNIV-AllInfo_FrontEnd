import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { COLORS } from '../../constants/theme';
import CustomAlert from '../../components/ui/CustomAlert';
import { useAppleGame } from './hooks/useAppleGame';
import AppleGrid from './components/AppleGrid';
import { useAuth } from '../../context/AuthContext'; // Added import
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

import { GAMES } from '../../constants/games'; // Added import

const AppleGameScreen = () => {
    const {
        grid,
        score,
        timeLeft,
        gameState,
        isPlaying,
        selectedIndices,
        firstSelection,
        setGameState,
        startGame,
        initGame,
        handleCellPress,
        CELL_SIZE,
        COLS
    } = useAppleGame();

    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [alertVisible, setAlertVisible] = useState(false);

    // Auth Context & Local Best Score
    const { userEmail, gameBestScores, updateGameBestScore } = useAuth(); // Added useAuth destructuring
    const [myBestScore, setMyBestScore] = useState(0);
    const GAME_ID = GAMES.APPLE_GAME.id;

    // Load local best score
    React.useEffect(() => {
        if (gameBestScores && typeof gameBestScores[GAME_ID] === 'number') {
            setMyBestScore(gameBestScores[GAME_ID]);
        }
    }, [gameBestScores]);

    // 게임 종료 시 알림 처리를 위한 useEffect
    React.useEffect(() => {
        if (gameState === 'PLAYING' && !isPlaying && timeLeft <= 0) {
            setAlertVisible(true);
            // Save score
            updateGameBestScore(GAME_ID, score);
            // Update local display immediately if higher
            if (score > myBestScore) {
                setMyBestScore(score);
            }
        }
    }, [gameState, isPlaying, timeLeft, score, updateGameBestScore, myBestScore]);

    if (gameState === 'MENU') {
        return (
            <View style={[styles.container, styles.menuContainer]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.menuBackButton, { top: insets.top + 10 }]}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.menuHeader}>
                    <AppText style={styles.menuTitle}>두쫀쿠 게임!</AppText>
                    <View style={{ marginTop: 10 }}>
                        <AppText style={{ fontSize: 16, color: '#666', fontWeight: 'bold' }}>
                            내 최고 점수: <AppText style={{ color: COLORS.PRIMARY }}>{myBestScore}</AppText>
                        </AppText>
                    </View>
                    <AppText style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
                        터치 두번으로 합이 10이되도록 만드세요!
                    </AppText>
                </View>

                <View style={styles.menuContent}>
                    <TouchableOpacity style={styles.menuButton} onPress={startGame}>
                        <AppText style={styles.menuButtonText}>게임 시작</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0) }]}>
                {/* 왼쪽 영역: 뒤로가기 버튼 + 현재 점수 */}
                <View style={styles.leftContainer}>
                    <TouchableOpacity onPress={() => setGameState('MENU')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.scoreContainer}>
                        <AppText style={styles.label}>점수</AppText>
                        <AppText style={styles.value}>{score}</AppText>
                    </View>
                </View>

                {/* 중앙 영역: 타이틀 + 최고 점수 */}
                <View style={styles.centerContainer}>
                    <AppText style={styles.title}>두쫀쿠</AppText>
                    <AppText style={styles.bestScoreText}>Best: {myBestScore}</AppText>
                </View>

                {/* 오른쪽 영역: 남은 시간 */}
                <View style={styles.rightContainer}>
                    <View style={styles.scoreContainer}>
                        <AppText style={styles.label}>남은시간</AppText>
                        <AppText style={[styles.value, timeLeft <= 10 && styles.warning]}>
                            {timeLeft}
                        </AppText>
                    </View>
                </View>
            </View>

            <AppleGrid
                grid={grid}
                selectedIndices={selectedIndices}
                firstSelection={firstSelection}
                onCellPress={handleCellPress}
                cellSize={CELL_SIZE}
                cols={COLS}
            />

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
                        text: '메뉴로',
                        onPress: () => {
                            setAlertVisible(false);
                            setGameState('MENU');
                        },
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
    leftContainer: {
        flex: 1.5, // 뒤로가기 버튼 공간 고려
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 20, // 오른쪽 컨테이너의 marginRight을 상쇄시켜 완벽한 중앙에 위치하도록 함
    },
    rightContainer: {
        flex: 1.5,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginRight: 20,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    bestScoreText: {
        fontSize: 12,
        color: COLORS.PRIMARY,
        fontWeight: 'bold'
    },
    scoreContainer: {
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: -10, // 값 텍스트와의 간격 줄이기
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    warning: {
        color: 'red',
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
    menuContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    menuBackButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    menuHeader: {
        marginTop: 60,
        marginBottom: 80,
        alignItems: 'center',
    },
    menuTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    menuContent: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    menuButton: {
        width: '60%',
        backgroundColor: '#a6f64aff',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    menuButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    menuButtonSecondary: {
        width: '60%',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: COLORS.PRIMARY,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    menuButtonTextSecondary: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AppleGameScreen;
