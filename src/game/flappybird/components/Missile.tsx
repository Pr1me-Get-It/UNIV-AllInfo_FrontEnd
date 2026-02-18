import React from 'react';
import { Image } from 'react-native';
import { Images } from '../assets/images';

const Missile = (props: any) => {
    const width = props.body.bounds.max.x - props.body.bounds.min.x;
    const height = props.body.bounds.max.y - props.body.bounds.min.y;
    const x = props.body.position.x - width / 2;
    const y = props.body.position.y - height / 2;

    return (
        <Image
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
            }}
            resizeMode="contain"
            source={Images.rocket}
        />
    );
};

export default Missile;
