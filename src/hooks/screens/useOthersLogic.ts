import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const useOthersLogic = () => {
    const navigation = useNavigation();

    const features = [
        {
            id: 'clocktower',
            title: '시계탑',
            icon: 'time-outline',
            color: '#3B82F6', // Blue
            bgColor: '#EFF6FF',
        },
        {
            id: 'reactionTest',
            title: '반응속도',
            icon: 'flash-outline',
            color: '#14B8A6', // Teal
            bgColor: '#F0FDFA',
        },
    ];

    const games = [
        {
            id: 'ranking',
            title: '랭킹 보기',
            icon: 'trophy-outline',
            color: '#F59E0B', // Amber
            bgColor: '#FFFBEB',
        },
        {
            id: 'tetris',
            title: '테트리스',
            icon: 'game-controller-outline',
            color: '#8B5CF6', // Purple
            bgColor: '#F5F3FF',
        },
        {
            id: 'applegame',
            title: '두쫀쿠', // Shortened name for compact view
            icon: 'grid-outline',
            color: '#10B981', // Emerald
            bgColor: '#ECFDF5',
        },
        {
            id: 'flappybird',
            title: '호반우', // Shortened name
            icon: 'rocket-outline',
            color: '#EF4444', // Red
            bgColor: '#FEF2F2',
        },
    ];

    const handlePress = (title: string, id: string) => {
        if (id === 'ranking') {
            (navigation as any).navigate('Ranking');
        } else if (id === 'tetris') {
            (navigation as any).navigate('Tetris');
        } else if (id === 'applegame') {
            (navigation as any).navigate('AppleGame');
        } else if (id === 'flappybird') {
            (navigation as any).navigate('FlappyBird');
        } else if (id === 'reactionTest') {
            (navigation as any).navigate('FishingGame');
        } else {
            // For future features or clocktower if implemented
            Alert.alert(title, '준비 중인 기능입니다.');
        }
    };

    return {
        features,
        games,
        handlePress,
    };
};
