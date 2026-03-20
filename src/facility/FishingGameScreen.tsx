import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AppText from '../components/AppText';
import { COLORS } from '../constants/colors';
import { moderateScale } from '../utils/responsive';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withSpring,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';

type FishingGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FishingGame'>;

interface Props {
    navigation: FishingGameNavigationProp;
}

type GameState = 'idle' | 'waiting' | 'ready' | 'result';

const { width, height } = Dimensions.get('window');

export default function FishingGameScreen({ navigation }: Props) {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [resultMessage, setResultMessage] = useState<string>('');

    const bobberY = useSharedValue(0);
    const bobberScale = useSharedValue(1);

    // 타임아웃 참조
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const biteTimeRef = useRef<number>(0);

    // 컴포넌트 언마운트 시 타임아웃 정리
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const startFloatingAnimation = () => {
        bobberY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(10, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // 무한 반복
            true // reverse
        );
    };

    const stopAnimations = () => {
        cancelAnimation(bobberY);
        cancelAnimation(bobberScale);
    };

    const handlePress = () => {
        if (gameState === 'idle' || gameState === 'result') {
            startGame();
        } else if (gameState === 'waiting') {
            handleEarlyClick();
        } else if (gameState === 'ready') {
            handleSuccessClick();
        }
    };

    const startGame = () => {
        setGameState('waiting');
        setReactionTime(null);
        setResultMessage('');

        // 찌 크기 초기화 및 둥둥 애니메이션 시작
        bobberScale.value = 1;
        startFloatingAnimation();

        // 2초 ~ 6초 사이 랜덤 대기
        const randomDelay = Math.random() * 4000 + 2000;

        timeoutRef.current = setTimeout(() => {
            triggerBite();
        }, randomDelay);
    };

    const triggerBite = () => {
        setGameState('ready');
        biteTimeRef.current = Date.now();

        // 입질: 기존 둥둥 애니메이션 멈추고 밑으로 확 꺼짐
        stopAnimations();
        bobberY.value = withTiming(80, { duration: 50, easing: Easing.in(Easing.ease) });
        bobberScale.value = withTiming(0.7, { duration: 50 });
    };

    const handleEarlyClick = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        stopAnimations();

        setGameState('result');
        setResultMessage('너무 빨랐습니다!\n물고기가 도망갔어요.');

        // 찌가 도망가는 모션
        bobberY.value = withSpring(-200);
        bobberScale.value = withTiming(0);
    };

    const handleSuccessClick = () => {
        const endTime = Date.now();
        const timeDiff = endTime - biteTimeRef.current;

        stopAnimations();
        setReactionTime(timeDiff);
        setGameState('result');

        if (timeDiff < 250) {
            setResultMessage('전광석화!\n완벽한 타이밍입니다!');
        } else if (timeDiff < 400) {
            setResultMessage('좋습니다!\n물고기를 낚았습니다!');
        } else {
            setResultMessage('조금 느렸네요.\n간신히 낚았습니다.');
        }

        if (bestTime === null || timeDiff < bestTime) {
            setBestTime(timeDiff);
        }

        // 낚아채는 모션
        bobberY.value = withSpring(-150, { damping: 10, stiffness: 100 });
        bobberScale.value = withSpring(1.5);
    };

    const animatedBobberStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: bobberY.value },
                { scale: bobberScale.value }
            ] as any, // 린트 에러 방지용 (useAnimatedStyle 타입 추론 한계)
        };
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#111" />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>반응속도 테스트</AppText>
                <View style={{ width: 44 }} />
            </View>

            <TouchableOpacity
                activeOpacity={1}
                style={[
                    styles.gameContainer,
                    gameState === 'ready' && styles.gameContainerReady
                ]}
                onPress={handlePress}
            >
                <View style={styles.infoArea}>
                    {gameState === 'idle' && (
                        <AppText style={styles.guideText}>
                            화면을 터치하여 낚싯대를 던지세요.{'\n'}찌가 물 속으로 들어가는 순간 터치하세요!
                        </AppText>
                    )}
                    {gameState === 'waiting' && (
                        <AppText style={styles.guideText}>
                            입질을 기다리는 중...
                        </AppText>
                    )}
                    {gameState === 'ready' && (
                        <AppText style={styles.readyText}>
                            지금 낚아채세요!!!
                        </AppText>
                    )}
                    {gameState === 'result' && (
                        <View style={styles.resultContainer}>
                            <AppText style={styles.resultMessage}>{resultMessage}</AppText>
                            {reactionTime !== null && (
                                <AppText style={styles.timeText}>{reactionTime} ms</AppText>
                            )}
                            <AppText style={styles.guideText}>
                                다시 하려면 터치하세요
                            </AppText>
                        </View>
                    )}
                </View>

                <View style={styles.waterArea}>
                    {/* 수면 효과 라인 */}
                    <View style={styles.waterLine} />

                    {/* 찌 (Bobber) */}
                    <Animated.View style={[styles.bobberContainer, animatedBobberStyle]}>
                        <View style={styles.bobberTop} />
                        <View style={styles.bobberBottom} />
                    </Animated.View>
                </View>

                {bestTime !== null && (
                    <View style={styles.bestTimeContainer}>
                        <AppText style={styles.bestTimeText}>최고 기록: {bestTime} ms</AppText>
                    </View>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: moderateScale(18, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#E0F2FE', // 밝은 하늘색 (낮의 하늘)
    },
    gameContainerReady: {
        backgroundColor: '#BAE6FD', // 입질 시 살짝 어두워지는 효과
    },
    infoArea: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60, // 적당한 상단 여백으로 조절
    },
    guideText: {
        fontSize: moderateScale(18, 0.3),
        color: '#334155',
        textAlign: 'center',
        lineHeight: 28,
        fontWeight: '600',
    },
    readyText: {
        fontSize: moderateScale(32, 0.3),
        color: '#EF4444',
        fontWeight: '900',
        textAlign: 'center',
    },
    resultContainer: {
        alignItems: 'center',
        gap: 16,
    },
    resultMessage: {
        fontSize: moderateScale(22, 0.3),
        color: '#1E293B',
        textAlign: 'center',
        fontWeight: 'bold',
        lineHeight: 32,
    },
    timeText: {
        fontSize: moderateScale(48, 0.3),
        color: COLORS.primary,
        fontWeight: '900',
    },
    waterArea: {
        height: height * 0.4,
        backgroundColor: '#0284C7', // 진한 파란색 (물)
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    waterLine: {
        width: '100%',
        height: 4,
        backgroundColor: '#38BDF8',
        opacity: 0.8,
    },
    bobberContainer: {
        width: 30,
        height: 60,
        marginTop: -30, // 물 밖으로 절반 나오게 설정
        alignItems: 'center',
    },
    bobberTop: {
        width: 30,
        height: 30,
        backgroundColor: '#EF4444', // 빨간색 머리
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    bobberBottom: {
        width: 30,
        height: 30,
        backgroundColor: '#F8FAFC', // 하얀색 몸통
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    bestTimeContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bestTimeText: {
        fontSize: moderateScale(16, 0.3),
        color: '#fff',
        fontWeight: 'bold',
    },
});
