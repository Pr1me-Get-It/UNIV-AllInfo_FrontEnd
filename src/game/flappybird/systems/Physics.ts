import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { getPipeSizePosPair } from '../utils/random';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export const Physics = (entities: any, { touches, time, dispatch }: any) => {
    let engine = entities.physics.engine;

    // 게임 시작 전 대기 상태 로직
    if (!entities.physics.started) {
        // 터치 시 게임 시작
        const startTouch = touches.find((t: any) => t.type === 'press');
        if (startTouch) {
            entities.physics.started = true;
            entities.physics.gameOver = false; // 🔴 게임오버 플래그 초기화
            entities.physics.engine.gravity.y = 1.3; // 중력 활성화

            // 첫 점프
            Matter.Body.setVelocity(entities.Bird.body, {
                x: 0,
                y: -7
            });
            entities.Bird.angle += 20;

            dispatch({ type: 'game_start' });
        }

        // 대기 상태에서도 물리 엔진은 업데이트하지만, 중력이 0이라 떨어지지 않음
        // delta 값을 최대 16.666ms(60fps)로 제한하여 물리 엔진 경고 방지 및 안정성 확보
        Matter.Engine.update(engine, Math.min(time.delta, 16.666));

        // 대기 상태에서는 파이프 이동 및 생성/삭제 로직 실행 안 함
        return entities;
    }

    // ✅ 이미 게임오버 상태라면 바로 리턴 (중복 이벤트 방지)
    if (entities.physics.gameOver) {
        return entities;
    }

    // 게임 시작 후 로직 (기존 로직)

    // 터치 처리 (점프)
    touches.filter((t: any) => t.type === 'press').forEach((t: any) => {
        Matter.Body.setVelocity(entities.Bird.body, {
            x: 0,
            y: -7
        });
        entities.Bird.angle += 20;
    });

    // 물리 엔진 업데이트 (delta 값을 최대 16.666ms로 제한)
    const clampedDelta = Math.min(time.delta, 16.666);
    Matter.Engine.update(engine, clampedDelta);

    // 60fps 기준 정규화 계수 (16.666ms = 1프레임 기준)
    const deltaFactor = clampedDelta / 16.666;

    // 충돌 감지: Bird 바디가 포함된 쌍에만 game_over 처리 (리스너 중복 등록 방지)
    if (!entities.physics.collisionHandler) {
        const birdBody = entities.Bird.body;
        const handler = (event: any) => {
            if (entities.physics.gameOver) return;
            const involved = event.pairs.some(
                (pair: any) => pair.bodyA === birdBody || pair.bodyB === birdBody
            );
            if (!involved) return;
            entities.physics.gameOver = true;
            dispatch({ type: 'game_over' });
        };
        Matter.Events.on(engine, 'collisionStart', handler);
        entities.physics.collisionHandler = handler;
    }

    // 새 회전 처리 - delta 정규화 (60fps 기준 1도/프레임)
    entities.Bird.angle += 1 * deltaFactor;

    // 파이프 이동 및 생성/삭제 로직
    for (let i = 1; i <= 3; i++) {
        const pipeTop = entities[`PipeTop${i}`];
        const pipeBottom = entities[`PipeBottom${i}`];

        // 파이프 이동 - delta 정규화 (60fps 기준 2.4px/프레임)
        if (pipeTop && pipeBottom) {
            Matter.Body.translate(pipeTop.body, { x: -2.4 * deltaFactor, y: 0 });
            Matter.Body.translate(pipeBottom.body, { x: -2.4 * deltaFactor, y: 0 });
        }

        // 화면 밖으로 나가면 재활용 (위치 리셋)
        if (pipeTop && pipeTop.body.position.x <= -100) {
            // 3개의 파이프가 0.7 * windowWidth 간격으로 배치됨
            // 재활용 시 마지막 파이프 뒤에 붙여야 함
            // 계산식: -100 + 3 * (0.7 * W) - W = 1.1 * W - 100
            const pipeSizePos = getPipeSizePosPair(windowWidth * 1.1 - 100);

            Matter.Body.setPosition(pipeTop.body, pipeSizePos.pipeTop.pos);
            Matter.Body.setPosition(pipeBottom.body, pipeSizePos.pipeBottom.pos);

            // 점수 초기화
            pipeTop.scored = false;
        }

        // 점수 획득 로직
        if (pipeTop && !pipeTop.scored && pipeTop.body.position.x < entities.Bird.body.position.x) {
            pipeTop.scored = true;
            entities.physics.score += 1; // 점수 업데이트
            dispatch({ type: 'score' });
        }
    }

    // 바닥 이동 (Removed)

    // 화면 하단 충돌 체크 (Game Over)
    if (entities.Bird.body.position.y >= windowHeight) {
        entities.physics.gameOver = true; // 🔴 플래그 설정
        dispatch({ type: 'game_over' });
        return entities;
    }


    if (entities.physics.score >= 10) {
        const missile = entities.Missile;

        // 미사일 이동 - delta 정규화 (60fps 기준 4px/프레임)
        Matter.Body.translate(missile.body, { x: -4 * deltaFactor, y: 0 });

        // 화면 밖으로 나가면 재활용 (딜레이 추가)
        if (missile.body.position.x < -50) {
            const randomY = Math.floor(Math.random() * (windowHeight - 100)) + 50;
            // 미사일이 자주 나오지 않도록 x 좌표를 멀리 랜덤하게 띄워줌 (100 ~ 600 사이 딜레이 스폰)
            const randomDelayX = windowWidth + 100 + Math.random() * 500;
            Matter.Body.setPosition(missile.body, { x: randomDelayX, y: randomY });
        }
    } else {
        // 점수가 10 미만이면 미사일을 화면 밖으로 치워둠
        Matter.Body.setPosition(entities.Missile.body, { x: windowWidth + 1000, y: windowHeight / 2 });
    }

    return entities;
};
