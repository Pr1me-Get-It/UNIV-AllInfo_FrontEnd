import Matter from 'matter-js';
import Bird from '../components/Bird';

import Pipe from '../components/Pipe';
import { Dimensions } from 'react-native';
import { getPipeSizePosPair } from '../utils/random';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export default () => {
    let engine = Matter.Engine.create({ enableSleeping: false });
    let world = engine.world;

    engine.gravity.y = 1.2;

    const pipeSizePosA = getPipeSizePosPair(0);
    const pipeSizePosB = getPipeSizePosPair(windowWidth);

    const bird = Matter.Bodies.rectangle(50, windowHeight / 2, 50, 50);

    // Floor - Removed

    // Pipe A
    const pipeTop1 = Matter.Bodies.rectangle(pipeSizePosA.pipeTop.pos.x, pipeSizePosA.pipeTop.pos.y, 50, windowHeight, { isStatic: true, label: 'PipeTop', scored: false });
    const pipeBottom1 = Matter.Bodies.rectangle(pipeSizePosA.pipeBottom.pos.x, pipeSizePosA.pipeBottom.pos.y, 50, windowHeight, { isStatic: true, label: 'Pipe' });

    // Pipe B
    const pipeTop2 = Matter.Bodies.rectangle(pipeSizePosB.pipeTop.pos.x, pipeSizePosB.pipeTop.pos.y, 50, windowHeight, { isStatic: true, label: 'PipeTop', scored: false });
    const pipeBottom2 = Matter.Bodies.rectangle(pipeSizePosB.pipeBottom.pos.x, pipeSizePosB.pipeBottom.pos.y, 50, windowHeight, { isStatic: true, label: 'Pipe' });

    Matter.World.add(world, [bird, pipeTop1, pipeBottom1, pipeTop2, pipeBottom2]);

    return {
        physics: { engine: engine, world: world },
        Bird: { body: bird, renderer: Bird },
        PipeTop1: { body: pipeTop1, renderer: Pipe, isTop: true, scored: false },
        PipeBottom1: { body: pipeBottom1, renderer: Pipe, isTop: false },
        PipeTop2: { body: pipeTop2, renderer: Pipe, isTop: true, scored: false },
        PipeBottom2: { body: pipeBottom2, renderer: Pipe, isTop: false },
    };
};
