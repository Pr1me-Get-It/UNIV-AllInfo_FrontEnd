import Matter from 'matter-js';
import Bird from '../components/Bird';
import Missile from '../components/Missile';

import Pipe from '../components/Pipe';
import { Dimensions } from 'react-native';
import { getPipeSizePosPair } from '../utils/random';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export default () => {
    let engine = Matter.Engine.create({ enableSleeping: false });
    let world = engine.world;

    engine.gravity.y = 0.0; // 처음에 중력 0으로 설정 (대기 상태)

    const pipeSizePosA = getPipeSizePosPair(0);
    const pipeSizePosB = getPipeSizePosPair(windowWidth * 0.75);
    const pipeSizePosC = getPipeSizePosPair(windowWidth * 1.5);

    const bird = Matter.Bodies.rectangle(50, windowHeight / 2, 50, 50, { inertia: Infinity });

    // Floor - Removed

    // Pipe A
    const pipeTop1 = Matter.Bodies.rectangle(pipeSizePosA.pipeTop.pos.x, pipeSizePosA.pipeTop.pos.y, 50, windowHeight, { isStatic: true, label: 'PipeTop', scored: false });
    const pipeBottom1 = Matter.Bodies.rectangle(pipeSizePosA.pipeBottom.pos.x, pipeSizePosA.pipeBottom.pos.y, 50, windowHeight, { isStatic: true, label: 'Pipe' });

    // Pipe B
    const pipeTop2 = Matter.Bodies.rectangle(pipeSizePosB.pipeTop.pos.x, pipeSizePosB.pipeTop.pos.y, 50, windowHeight, { isStatic: true, label: 'PipeTop', scored: false });
    const pipeBottom2 = Matter.Bodies.rectangle(pipeSizePosB.pipeBottom.pos.x, pipeSizePosB.pipeBottom.pos.y, 50, windowHeight, { isStatic: true, label: 'Pipe' });

    // Pipe C
    const pipeTop3 = Matter.Bodies.rectangle(pipeSizePosC.pipeTop.pos.x, pipeSizePosC.pipeTop.pos.y, 50, windowHeight, { isStatic: true, label: 'PipeTop', scored: false });
    const pipeBottom3 = Matter.Bodies.rectangle(pipeSizePosC.pipeBottom.pos.x, pipeSizePosC.pipeBottom.pos.y, 50, windowHeight, { isStatic: true, label: 'Pipe' });

    // Missile
    const missile = Matter.Bodies.rectangle(windowWidth + 100, windowHeight / 2, 100, 50, { isStatic: true, label: 'Missile' }); // isStatic: true so it doesn't fall, we move it manually

    Matter.World.add(world, [bird, pipeTop1, pipeBottom1, pipeTop2, pipeBottom2, pipeTop3, pipeBottom3, missile]);

    return {
        physics: { engine: engine, world: world, started: false, score: 0 },
        Bird: { body: bird, renderer: Bird, angle: 0 },
        PipeTop1: { body: pipeTop1, renderer: Pipe, isTop: true, scored: false },
        PipeBottom1: { body: pipeBottom1, renderer: Pipe, isTop: false },
        PipeTop2: { body: pipeTop2, renderer: Pipe, isTop: true, scored: false },
        PipeBottom2: { body: pipeBottom2, renderer: Pipe, isTop: false },
        PipeTop3: { body: pipeTop3, renderer: Pipe, isTop: true, scored: false },
        PipeBottom3: { body: pipeBottom3, renderer: Pipe, isTop: false },
        Missile: { body: missile, renderer: Missile },
    };
};
