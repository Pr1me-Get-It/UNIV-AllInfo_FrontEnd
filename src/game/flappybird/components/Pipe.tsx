import React from 'react';
import { View, Image } from 'react-native';
import { Images } from '../assets/images';

const Pipe = (props: any) => {
    const width = props.body.bounds.max.x - props.body.bounds.min.x;
    const height = props.body.bounds.max.y - props.body.bounds.min.y;
    const x = props.body.position.x - width / 2;
    const y = props.body.position.y - height / 2;

    const pipeRatio = 160 / width;
    const pipeHeight = 33 * pipeRatio;
    // Calculate number of core segments needed. 
    // We need to account for the cap height. Let's assume cap is same aspect ratio as core or provided.
    // Looking at Images.ts, pipeTop is the cap.

    // Let's assume cap height is same as pipe width roughly or specific.
    // For pixel art, usually square-ish.
    const capHeight = pipeHeight; // Approximation

    const coreHeight = height - capHeight;
    const pipeIterations = Math.ceil(coreHeight / pipeHeight);

    // Optimized: Memoize the pipe segments to avoid re-creating arrays on every render
    // Since pipe height/width are constant after creation for a specific pipe instance, 
    // we can rely on React's diffing, but separating the static parts is better.
    // However, the props (position) change every frame.
    // We can't easily memoize the whole component because x/y change.
    // But we can generate the children once if specific props don't change.
    // Actually, `pipeIterations` depends on `coreHeight`, which depends on `height`.
    // Pipe height is fixed for a given pipe entity. `width` is fixed.
    // So `pipeIterations` is constant.

    // We can iterate without creating a new Array(N) filled with undefined every time.
    const pipeSegments = React.useMemo(() => {
        const segments = [];
        for (let i = 0; i < pipeIterations; i++) {
            segments.push(
                <Image
                    style={{ width: width, height: pipeHeight }}
                    key={i}
                    resizeMode="stretch"
                    source={Images.pipeCore}
                />
            );
        }
        return segments;
    }, [pipeIterations, width, pipeHeight]);

    return (
        <View
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
                overflow: 'hidden',
                flexDirection: 'column',
                justifyContent: props.isTop ? 'flex-end' : 'flex-start',
            }}>
            {props.isTop && (
                <>
                    {pipeSegments}
                    <Image
                        style={{ width: width, height: capHeight }}
                        resizeMode="stretch"
                        source={Images.pipeTop}
                    />
                </>
            )}

            {!props.isTop && (
                <>
                    <Image
                        style={{ width: width, height: capHeight }}
                        resizeMode="stretch"
                        source={Images.pipeTop}
                    />
                    {pipeSegments}
                </>
            )}
        </View>
    );
};

export default Pipe;
