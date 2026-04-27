import { useState, useEffect, useRef } from 'react';
import { ScrollView, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { AVAILABLE_LINKS } from '../../constants/links';

const CUSTOM_LINKS_KEY = 'CUSTOM_LINKS';
const DEFAULT_LINK_IDS = ['knu_main', 'knu_plan', 'knu_score', 'knu_sugang'];

export const useLinkSettingLogic = (navigation: NativeStackNavigationProp<RootStackParamList, 'LinkSetting'>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gridData, setGridData] = useState(
    AVAILABLE_LINKS.map(link => ({ ...link, key: link.id })),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const scrollBoundaries = useRef({ top: 180, bottom: 600 });
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    loadSettings();
    return () => stopAutoScroll();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSelected = await AsyncStorage.getItem(CUSTOM_LINKS_KEY);
      let currentSelected = DEFAULT_LINK_IDS;
      if (storedSelected) {
        currentSelected = JSON.parse(storedSelected);
      }
      setSelectedIds(currentSelected);

      const storedOrder = await AsyncStorage.getItem('ALL_LINKS_ORDER');
      if (storedOrder) {
        const orderArray = JSON.parse(storedOrder) as string[];
        const reorderedData = [...AVAILABLE_LINKS]
          .map(link => ({ ...link, key: link.id }))
          .sort((a, b) => {
            const idxA = orderArray.indexOf(a.id);
            const idxB = orderArray.indexOf(b.id);
            return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
          });
        setGridData(reorderedData);
      } else {
        setGridData(AVAILABLE_LINKS.map(link => ({ ...link, key: link.id })));
      }
    } catch (error) {
      console.error('Failed to load custom links settings', error);
      setSelectedIds(DEFAULT_LINK_IDS);
      setGridData(AVAILABLE_LINKS.map(link => ({ ...link, key: link.id })));
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      if (selectedIds.length === 0) {
        Alert.alert('알림', '최소 1개 이상의 링크를 선택해주세요.');
        return;
      }
      const orderedSelectedIds = gridData
        .filter(item => selectedIds.includes(item.id))
        .map(item => item.id);

      await AsyncStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(orderedSelectedIds));
      await AsyncStorage.setItem('ALL_LINKS_ORDER', JSON.stringify(gridData.map(item => item.id)));

      navigation.goBack();
    } catch (error) {
      Alert.alert('오류', '설정을 저장하는데 실패했습니다.');
      console.error('Failed to save custom links settings', error);
    }
  };

  const toggleLink = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleScroll = (event: any) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const startAutoScroll = (step: number) => {
    if (scrollInterval.current) return;
    scrollInterval.current = setInterval(() => {
      let newY = scrollY.current + step;
      if (newY < 0) newY = 0;
      scrollViewRef.current?.scrollTo({ y: newY, animated: false });
      scrollY.current = newY;
    }, 16);
  };

  const handleDragging = (gestureState: any) => {
    const { moveY } = gestureState;
    const { top, bottom } = scrollBoundaries.current;

    if (moveY < top) {
      startAutoScroll(-15);
    } else if (moveY > bottom) {
      startAutoScroll(15);
    } else {
      stopAutoScroll();
    }
  };

  const handleDragStart = () => {
    setScrollEnabled(false);
    (scrollViewRef.current as any)?.measure(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        if (pageY > 0 && height > 0) {
          scrollBoundaries.current = {
            top: pageY + 30,
            bottom: pageY + height - 30,
          };
        }
      },
    );
  };

  return {
    selectedIds,
    gridData,
    setGridData,
    isLoading,
    scrollEnabled,
    setScrollEnabled,
    scrollViewRef,
    saveSettings,
    toggleLink,
    handleScroll,
    stopAutoScroll,
    handleDragging,
    handleDragStart,
  };
};
