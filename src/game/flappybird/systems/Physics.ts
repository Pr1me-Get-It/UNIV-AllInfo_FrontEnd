import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { getPipeSizePosPair } from '../utils/random';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export const Physics = (entities: any, { touches, time, dispatch }: any) => {
    let engine = entities.physics.engine;

    // 터치 처리 (점프)
    touches.filter((t: any) => t.type === 'press').forEach((t: any) => {
        Matter.Body.setVelocity(entities.Bird.body, {
            x: 0,
            y: -7
        });
    });

    // 물리 엔진 업데이트
    Matter.Engine.update(engine, time.delta);

    // 파이프 이동 및 생성/삭제 로직
    for (let i = 1; i <= 2; i++) {
        const pipeTop = entities[`PipeTop${i}`];
        const pipeBottom = entities[`PipeBottom${i}`];

        // 파이프 이동
        if (pipeTop && pipeBottom) {
            Matter.Body.translate(pipeTop.body, { x: -2.4, y: 0 });
            Matter.Body.translate(pipeBottom.body, { x: -2.4, y: 0 });
        }

        // 화면 밖으로 나가면 재활용 (위치 리셋)
        if (pipeTop && pipeTop.body.position.x <= -100) {
            const pipeSizePos = getPipeSizePosPair(windowWidth * 2 - 100);

            Matter.Body.setPosition(pipeTop.body, pipeSizePos.pipeTop.pos);
            Matter.Body.setPosition(pipeBottom.body, pipeSizePos.pipeBottom.pos);

            // 점수 초기화
            pipeTop.scored = false;
        }

        // 점수 획득 로직
        if (pipeTop && !pipeTop.scored && pipeTop.body.position.x < entities.Bird.body.position.x) {
            pipeTop.scored = true;
            dispatch({ type: 'score' });
        }
    }

    // 바닥 이동 (Removed)

    // 화면 하단 충돌 체크 (Game Over)
    if (entities.Bird.body.position.y >= windowHeight) {
        dispatch({ type: 'game_over' });
    }


    // 충돌 감지 (이벤트 리스너가 중복 등록되지 않도록 체크)
    if (!entities.physics.hasCollisionListener) {
        Matter.Events.on(engine, 'collisionStart', (event: any) => {
            dispatch({ type: 'game_over' });
        });
        entities.physics.hasCollisionListener = true;
    }

    return entities;
};
