import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GAMES } from '../../constants/games';
import { useInterval } from '../../game/tetris/hooks/useInterval';
import { usePlayer } from '../../game/tetris/hooks/usePlayer';
import { useStage } from '../../game/tetris/hooks/useStage';
import { useGameStatus } from '../../game/tetris/hooks/useGameStatus';
import { createStage, checkCollision } from '../../game/tetris/gameHelpers';

const { width, height } = Dimensions.get('window');

export const BOARD_COLS = 12;
export const BOARD_ROWS = 20;

export const useTetrisLogic = () => {
  const insets = useSafeAreaInsets();
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  const { gameBestScores, updateGameBestScore } = useAuth();
  const [myBestScore, setMyBestScore] = useState(0);
  const GAME_ID = GAMES.TETRIS.id;

  const { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer, nextTetromino } = usePlayer();
  const { stage, setStage, rowsCleared } = useStage(player, resetPlayer);
  const { score, setScore, rows, setRows, level, setLevel } = useGameStatus(rowsCleared);

  useEffect(() => {
    if (gameBestScores && typeof gameBestScores[GAME_ID] === 'number') {
      setMyBestScore(gameBestScores[GAME_ID]);
    }
  }, [gameBestScores]);

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const HEADER_HEIGHT = 40;
  const CONTROLS_HEIGHT = 220;
  const PADDING_V = 20;
  const TAB_BAR_HEIGHT = 50;

  const availableHeight = height - insets.top - insets.bottom - HEADER_HEIGHT - CONTROLS_HEIGHT - PADDING_V - TAB_BAR_HEIGHT;
  const availableWidth = width * 0.98;

  const cellSizeByHeight = availableHeight / BOARD_ROWS;
  const cellSizeByWidth = (availableWidth * 0.70) / BOARD_COLS;

  const CELL_SIZE = Math.min(cellSizeByHeight, cellSizeByWidth, 35);

  const startGame = () => {
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
  };

  const drop = () => {
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        setAlertVisible(true);

        updateGameBestScore(GAME_ID, score);
        if (score > myBestScore) {
          setMyBestScore(score);
        }
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  useInterval(() => {
    drop();
  }, dropTime);

  const getDropTime = (lvl: number) => {
    return 1000 / (lvl + 1) + 200;
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

  return {
    insets,
    dropTime,
    gameOver,
    alertVisible,
    setAlertVisible,
    myBestScore,
    player,
    stage,
    score,
    level,
    nextTetromino,
    CELL_SIZE,
    startGame,
    playerRotate,
    move,
    startFastDrop,
    stopFastDrop,
  };
};
