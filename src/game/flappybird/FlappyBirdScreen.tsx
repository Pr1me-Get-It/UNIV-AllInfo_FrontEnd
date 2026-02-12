import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
import SimpleGameEngine from './components/GameEngine';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Ionicons or similar
import { Physics } from './systems/Physics';
import Entities from './entities';
import { Images } from './assets/images';
import AppText from '../../components/AppText'; // Adjust path if needed

const systems = [Physics];

const FlappyBirdScreen = () => {
    const [running, setRunning] = useState(false);
    const gameEngineRef = React.useRef<any>(null);
    const [currentPoints, setCurrentPoints] = useState(0);
    const navigation = useNavigation();

    const initialEntities = React.useMemo(() => Entities(), []);

    useEffect(() => {
        setRunning(true);
    }, []);

    const onEvent = React.useCallback((e: any) => {
        if (e.type === 'game_over') {
            setRunning(false);
            // Alert or Modal for game over
        } else if (e.type === 'score') {
            setCurrentPoints(prev => prev + 1);
        }
    }, []);

    const resetGame = () => {
        if (gameEngineRef.current) {
            gameEngineRef.current.swap(Entities());
        }
        setRunning(true);
        setCurrentPoints(0);
    };

    return (
        <View style={styles.container}>
            <Image source={Images.background} style={styles.backgroundImage} resizeMode="stretch" />

            <SimpleGameEngine
                ref={gameEngineRef}
                style={styles.gameContainer}
                systems={systems}
                entities={initialEntities}
                running={running}
                onEvent={onEvent}>
                <StatusBar hidden={true} />
            </SimpleGameEngine>

            {!running && (
                <View style={styles.fullScreenButton}>
                    <TouchableOpacity style={styles.fullScreenButton} onPress={resetGame}>
                        <View style={styles.scoreContainer}>
                            <AppText style={styles.gameOverText}>Game Over</AppText>
                            <AppText style={styles.gameOverSubText}>Touch to Restart</AppText>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <AppText style={styles.scoreText}>{currentPoints}</AppText>
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
        zIndex: 5,
    },
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
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
