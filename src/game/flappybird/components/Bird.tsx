import React from 'react';
import { Image } from 'expo-image';
import { Images } from '../assets/images';

const Bird = (props: any) => {
    const width = props.body.bounds.max.x - props.body.bounds.min.x;
    const height = props.body.bounds.max.y - props.body.bounds.min.y;
    const x = props.body.position.x - width / 2;
    const y = props.body.position.y - height / 2;

    const image = Images.bird1;

    return (
        <Image
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
                transform: [{ rotate: `${props.angle}deg` }]
            }}
            contentFit="fill"
            source={image}
        />
    );
};

export default Bird;
