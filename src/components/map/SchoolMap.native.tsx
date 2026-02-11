import React from 'react';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { MapPin } from '../../data/mapData';

export interface SchoolMapProps {
    pins: MapPin[];
    onPinPress: (pin: MapPin) => void;
}

const initialRegion = {
    latitude: 37.5509,
    longitude: 127.0755,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
};

export default function SchoolMap({ pins, onPinPress }: SchoolMapProps) {
    return (
        <NaverMapView
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            mapType="Basic"
            layerGroups={{
                BUILDING: true,
                TRANSIT: true,
                BICYCLE: false,
                TRAFFIC: false,
                CADASTRAL: false,
                MOUNTAIN: false,
            }}
        >
            {pins.map((pin) => (
                <NaverMapMarkerOverlay
                    key={pin.id}
                    latitude={pin.latitude}
                    longitude={pin.longitude}
                    caption={{ text: pin.name }}
                    tintColor={
                        pin.type === 'facility' ? '#4CAF50' :
                            pin.type === 'administrative' ? '#FF9800' :
                                '#9E9E9E'
                    }
                    onTap={() => onPinPress(pin)}
                />
            ))}
        </NaverMapView>
    );
}
