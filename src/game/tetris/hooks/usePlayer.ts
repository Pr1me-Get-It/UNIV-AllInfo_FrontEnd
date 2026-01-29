import { useState, useCallback } from 'react';
import { TETROMINOS, randomTetromino } from '../tetrominos';
import { STAGE_WIDTH, checkCollision } from '../gameHelpers';

export const usePlayer = () => {
    const [player, setPlayer] = useState<{
        pos: { x: number; y: number };
        tetromino: (string | number)[][];
        collided: boolean;
    }>({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS[0].shape,
        collided: false,
    });

    const [nextTetromino, setNextTetromino] = useState(randomTetromino().shape);

    const rotate = (matrix: any[], dir: number) => {
        // Make the rows to become cols (transpose)
        const rotatedTetro = matrix.map((_, index) =>
            matrix.map(col => col[index])
        );
        // Reverse each row to get a rotated matrix
        if (dir > 0) return rotatedTetro.map(row => row.reverse());
        return rotatedTetro.reverse();
    };

    const playerRotate = (stage: any, dir: number) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
        setPlayer(prev => ({
            ...prev,
            pos: { x: (prev.pos.x + x), y: (prev.pos.y + y) },
            collided,
        }));
    };

    const resetPlayer = useCallback(() => {
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
            tetromino: nextTetromino,
            collided: false,
        });
        setNextTetromino(randomTetromino().shape);
    }, [nextTetromino]);

    return { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer, nextTetromino };
};
