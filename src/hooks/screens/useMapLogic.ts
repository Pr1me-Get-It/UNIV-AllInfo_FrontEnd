import { useState, useRef, useEffect } from 'react';
import { Dimensions, Animated } from 'react-native';
import { MAP_PINS, MapPin } from '../../data/mapData';
import { useAuth } from '../../context/AuthContext';
import { saveData, getData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

export const INITIAL_REGION = {
  latitude: 35.888753,
  longitude: 128.610514,
  zoom: 14,
};

export const SUGGESTED_KEYWORDS = [
  { label: '학식당', icon: 'restaurant', color: '#FF9800' }, // Orange
  { label: '무인카페', icon: 'cafe', color: '#795548' }, // Brown
  { label: '편의점', icon: 'cart', color: '#2196F3' }, // Blue
  { label: '도서관', icon: 'book', color: '#3F51B5' }, // Indigo
  { label: '프린트', icon: 'print', color: '#009688' }, // Teal
];

export const PIN_TYPES = [
  { key: 'facility', label: '시설', color: '#4CAF50' },
  { key: 'administrative', label: '행정', color: '#FF9800' },
  { key: 'door', label: '출입문', color: '#E91E63' },
  { key: 'other', label: '기타', color: '#9E9E9E' },
];

export const useMapLogic = () => {
  const { userEmail } = useAuth();
  
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['facility', 'administrative', 'other', 'door']);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    const loadFilters = async () => {
      if (userEmail) {
        const safeEmail = userEmail.replace(/[.@]/g, '_');
        const key = STORAGE_KEYS.MAP_FILTER(safeEmail);
        const savedFilters = await getData(key);
        if (savedFilters) {
          setVisibleTypes(savedFilters as string[]);
        }
      }
    };
    loadFilters();
  }, [userEmail]);

  useEffect(() => {
    if (selectedPin) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
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

  const togglePinType = async (type: string) => {
    let newTypes: string[];
    if (visibleTypes.includes(type)) {
      newTypes = visibleTypes.filter((t) => t !== type);
    } else {
      newTypes = [...visibleTypes, type];
    }
    setVisibleTypes(newTypes);

    if (userEmail) {
      const safeEmail = userEmail.replace(/[.@]/g, '_');
      const key = STORAGE_KEYS.MAP_FILTER(safeEmail);
      await saveData(key, newTypes);
    }
  };

  const filteredPins = MAP_PINS.filter((pin) => visibleTypes.includes(pin.type));

  const handleMarkerClick = (pin: MapPin) => {
    setSelectedPin(pin);
  };

  const isMapReady = false;

  return {
    selectedPin,
    searchText,
    setSearchText,
    isSidebarOpen,
    setIsSidebarOpen,
    visibleTypes,
    slideAnim,
    closeBottomSheet,
    togglePinType,
    filteredPins,
    handleMarkerClick,
    isMapReady,
  };
};
