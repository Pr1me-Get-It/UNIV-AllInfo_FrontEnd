import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ReactNativeZoomableView } from '@dudigital/react-native-zoomable-view';
import { MapPin } from '../../data/mapData';

export interface SchoolMapProps {
    pins: MapPin[];
    onPinPress: (pin: MapPin) => void;
}

export default function SchoolMap({ pins, onPinPress }: SchoolMapProps) {
    return (
        <ReactNativeZoomableView
            maxZoom={2.0}
            minZoom={0.5}
            zoomStep={0.1}
            initialZoom={1}
            bindToBorders={true}
            style={styles.mapContainer}
        >
            <View style={styles.mapContainer}>
                <Image
                    source={require('../../assets/map.webp')}
                    style={styles.mapImage}
                    resizeMode="contain"
                />
                {/* Potentially render pins here for web later if needed */}
            </View>
        </ReactNativeZoomableView>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
});
