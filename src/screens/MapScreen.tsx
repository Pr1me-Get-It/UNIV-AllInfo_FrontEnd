import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import AppText from '../components/AppText';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { Ionicons } from '@expo/vector-icons';
import { MAP_PINS, MapPin } from '../data/mapData';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const { width } = Dimensions.get('window');

// Define default camera position (first pin or center of campus)
const INITIAL_REGION = {
  latitude: 35.888753,
  longitude: 128.610514,
  zoom: 14,
};

export default function MapScreen() {
  const { userEmail } = useAuth();

  useEffect(() => {
    // console.log('MapScreen: Mounted');
    // return () => console.log('MapScreen: Unmounted');
  }, []);

  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['facility', 'administrative', 'other']);

  // Load saved filters on mount or when userEmail changes
  useEffect(() => {
    const loadFilters = async () => {
      if (userEmail) {
        const safeEmail = userEmail.replace(/[.@]/g, '_'); // sanitize email for key
        const key = STORAGE_KEYS.MAP_FILTER(safeEmail);
        const savedFilters = await getData(key);
        if (savedFilters) {
          setVisibleTypes(savedFilters as string[]);
        }
      }
    };
    loadFilters();
  }, [userEmail]);

  // Animation value for bottom sheet
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (selectedPin) {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down
      slideAnim.setValue(Dimensions.get('window').height);
    }
  }, [selectedPin]);

  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSelectedPin(null));
  };

  const SUGGESTED_KEYWORDS = [
    { label: '학식당', icon: 'restaurant', color: '#FF9800' }, // Orange
    { label: '무인카페', icon: 'cafe', color: '#795548' }, // Brown
    { label: '편의점', icon: 'cart', color: '#2196F3' }, // Blue
    { label: '도서관', icon: 'book', color: '#3F51B5' }, // Indigo
    { label: '프린트', icon: 'print', color: '#009688' }, // Teal
  ];

  const PIN_TYPES = [
    { key: 'facility', label: '시설', color: '#4CAF50' },
    { key: 'administrative', label: '행정', color: '#FF9800' },
    { key: 'other', label: '기타', color: '#9E9E9E' },
  ];

  const togglePinType = async (type: string) => {
    let newTypes: string[];
    if (visibleTypes.includes(type)) {
      newTypes = visibleTypes.filter((t) => t !== type);
    } else {
      newTypes = [...visibleTypes, type];
    }
    setVisibleTypes(newTypes);

    // Save to storage if user is logged in
    if (userEmail) {
      const safeEmail = userEmail.replace(/[.@]/g, '_');
      const key = STORAGE_KEYS.MAP_FILTER(safeEmail);
      await saveData(key, newTypes);
    }
  };

  const filteredPins = MAP_PINS.filter((pin) => visibleTypes.includes(pin.type));

  // Handle marker click
  const handleMarkerClick = (pin: MapPin) => {
    setSelectedPin(pin);
  };

  return (
    <View style={styles.page}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="map" size={24} color={COLORS.primary} />
          <AppText style={styles.headerTitle}>학교지도</AppText>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="장소 검색"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
            {SUGGESTED_KEYWORDS.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip} onPress={() => setSearchText(item.label)}>
                <Ionicons name={item.icon as any} size={16} color={item.color} style={styles.chipIcon} />
                <AppText style={styles.chipText}>{item.label}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.mapArea}>
        <NaverMapView
          style={styles.mapContainer}
          initialCamera={INITIAL_REGION}
          mapType="Basic"
          layerGroups={{
            BUILDING: true,
            TRANSIT: true,
            TRAFFIC: false,
            BICYCLE: false,
            MOUNTAIN: false,
            CADASTRAL: false,
          }}
          onInitialized={() => {
            if (__DEV__) console.log('[NaverMap] onInitialized - Map loaded securely.');
          }}
          onCameraChanged={(args) => {
            // console.log('[NaverMap] onCameraChanged:', args);
          }}
          onTapMap={(args) => {
            if (__DEV__) console.log('[NaverMap] onTapMap:', args);
          }}
        >
          {filteredPins.map((pin) => (
            <NaverMapMarkerOverlay
              key={pin.id}
              latitude={pin.latitude}
              longitude={pin.longitude}
              caption={{ text: pin.name }}
              onTap={() => {
                // console.log('NaverMap: Marker Tapped', pin.name);
                handleMarkerClick(pin);
              }}
              width={30}
              height={40}
            />
          ))}
        </NaverMapView>

        <TouchableOpacity
          style={[styles.sidebarToggle, isSidebarOpen ? styles.sidebarToggleOpen : null]}
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Ionicons name={isSidebarOpen ? "chevron-forward" : "list"} size={24} color="#333" />
        </TouchableOpacity>

        {isSidebarOpen && (
          <View style={styles.sidebar}>
            <AppText style={styles.sidebarTitle}>핀 필터</AppText>
            {PIN_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={styles.filterItem}
                onPress={() => togglePinType(type.key)}
              >
                <Ionicons
                  name={visibleTypes.includes(type.key) ? "checkbox" : "square-outline"}
                  size={20}
                  color={visibleTypes.includes(type.key) ? COLORS.primary : "#999"}
                />
                <AppText style={styles.filterLabel}>{type.label}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedPin && (
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTitleRow}>
                <AppText style={styles.sheetTitle}>{selectedPin.name}</AppText>
                <AppText style={styles.infoType}>{selectedPin.type === 'facility' ? '시설' : selectedPin.type === 'administrative' ? '행정' : '기타'}</AppText>
              </View>
              <TouchableOpacity onPress={closeBottomSheet}>
                <Ionicons name="close-circle" size={30} color="#ccc" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetContent}>
              <AppText style={styles.infoDesc}>{selectedPin.description}</AppText>
              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chipsContainer: {
    marginTop: 12,
  },
  chipsContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: 'bold',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // removed mapImage style
  sidebarToggle: {
    position: 'absolute',
    right: 0,
    top: '20%',
    backgroundColor: 'white',
    padding: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  sidebarToggleOpen: {
    right: 150, // Width of sidebar
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    width: 150,
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 19,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '50%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
    zIndex: 30,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'column',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sheetContent: {
    flex: 1,
  },
  infoType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 10,
    backgroundColor: 'rgba(219, 31, 38, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoDesc: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
