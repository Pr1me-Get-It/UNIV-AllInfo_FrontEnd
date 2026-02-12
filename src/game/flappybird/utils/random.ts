import { Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export const getRandom = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getPipeSizePosPair = (addToPosX = 0) => {


    const pipeHeight = windowHeight;
    const gapHeight = 200; // Gap for the bird

    // Randomize the gap position
    // Center of the gap should be within screen bounds
    const minGapCenter = gapHeight / 2 + 150;
    const maxGapCenter = windowHeight - gapHeight / 2 - 150;
    const gapCenter = getRandom(minGapCenter, maxGapCenter);

    const topPipeCenterY = gapCenter - gapHeight / 2 - pipeHeight / 2;
    const bottomPipeCenterY = gapCenter + gapHeight / 2 + pipeHeight / 2;

    const pipeTop = { pos: { x: windowWidth + addToPosX, y: topPipeCenterY } };
    const pipeBottom = { pos: { x: windowWidth + addToPosX, y: bottomPipeCenterY } };

    return { pipeTop, pipeBottom };
};
