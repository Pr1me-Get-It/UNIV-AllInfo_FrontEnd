import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';

interface Touch {
    id: number;
    type: 'start' | 'move' | 'end' | 'press';
    event: any;
    delta?: { x: number; y: number };
}

interface GameEngineProps {
    systems: any[];
    entities: any;
    running: boolean;
    onEvent?: (e: any) => void;
    style?: any;
    children?: React.ReactNode;
}

export interface GameEngineRef {
    swap: (newEntities: any) => void;
    stopLoop: () => void;
}

const SimpleGameEngine = forwardRef<GameEngineRef, GameEngineProps>(({ systems, entities: initialEntities, running, onEvent, style, children }, ref) => {
    const [entities, setEntities] = useState(initialEntities);
    const entitiesRef = useRef(initialEntities);
    const loopRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const touchesRef = useRef<Touch[]>([]);
    const runningRef = useRef(running);

    // running 상태를 ref에 동기적으로 반영
    useEffect(() => {
        runningRef.current = running;
    }, [running]);

    // 외부에서 swap 호출 시 엔티티 초기화
    useImperativeHandle(ref, () => ({
        swap: (newEntities: any) => {
            entitiesRef.current = newEntities;
            setEntities(newEntities);
        },
        stopLoop: () => {
            runningRef.current = false;
            if (loopRef.current) {
                cancelAnimationFrame(loopRef.current);
                loopRef.current = null;
            }
        },
    }), []);

    // 터치 핸들러
    const handleTouchStart = (e: any) => {
        touchesRef.current.push({ id: e.nativeEvent.identifier, type: 'start', event: e.nativeEvent });
        touchesRef.current.push({ id: e.nativeEvent.identifier, type: 'press', event: e.nativeEvent }); // 간단한 press 이벤트 추가
    };

    const handleTouchMove = (e: any) => {
        touchesRef.current.push({ id: e.nativeEvent.identifier, type: 'move', event: e.nativeEvent });
    };

    const handleTouchEnd = (e: any) => {
        touchesRef.current.push({ id: e.nativeEvent.identifier, type: 'end', event: e.nativeEvent });
    };

    useEffect(() => {
        if (running) {
            lastTimeRef.current = Date.now();

            const loop = () => {
                // running이 false로 바뀌었으면 즉시 루프 중단
                if (!runningRef.current) return;

                const now = Date.now();
                const delta = now - lastTimeRef.current;
                lastTimeRef.current = now;

                let currentEntities = entitiesRef.current;
                const currentTouches = [...touchesRef.current];
                touchesRef.current = []; // 터치 큐 비우기

                // 시스템 실행
                const dispatch = (event: any) => {
                    if (onEvent) onEvent(event);
                };

                const time = { current: now, delta, previous: now - delta };

                systems.forEach(system => {
                    currentEntities = system(currentEntities, {
                        touches: currentTouches,
                        time,
                        dispatch
                    });
                });

                entitiesRef.current = currentEntities;

                // dispatch에서 setRunning(false)가 호출되었을 수 있으므로 다시 체크
                if (!runningRef.current) return;

                setEntities({ ...currentEntities }); // 리렌더링 트리거

                loopRef.current = requestAnimationFrame(loop);
            };

            loopRef.current = requestAnimationFrame(loop);
        }

        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
        };
    }, [running, systems, onEvent]);

    return (
        <View
            style={[styles.container, style]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
        >
            {Object.keys(entities).map(key => {
                const entity = entities[key];
                if (entity && entity.renderer) {
                    return <entity.renderer key={key} {...entity} />;
                }
                return null;
            })}
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});

export default SimpleGameEngine;
