import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import {
    fetchMultipleStationArrivals,
    DEFAULT_STATION_IDS,
    BusArrivalResult,
    BusArrivalItem,
} from '../../api/busService';

export const useBusWidgetLogic = () => {
    const [selectedStationId, setSelectedStationId] = useState<string>(DEFAULT_STATION_IDS[0]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [favoriteStationId, setFavoriteStationId] = useState<string | null>(null);

    // AsyncStorage에서 즐겨찾기 로드
    useEffect(() => {
        const loadFav = async () => {
            try {
                const fav = await AsyncStorage.getItem('FAVORITE_BUS_STATION');
                if (fav) {
                    setFavoriteStationId(fav);
                    setSelectedStationId(fav);
                }
            } catch (e) {}
        };
        loadFav();
    }, []);

    // 즐겨찾기 토글
    const toggleFavorite = async (stationId: string) => {
        try {
            if (favoriteStationId === stationId) {
                await AsyncStorage.removeItem('FAVORITE_BUS_STATION');
                setFavoriteStationId(null);
            } else {
                await AsyncStorage.setItem('FAVORITE_BUS_STATION', stationId);
                setFavoriteStationId(stationId);
            }
        } catch (e) {}
    };

    // React Query를 이용한 데이터 패칭 (5분 주기 자동 갱신)
    const { 
        data: arrivals = [], 
        isLoading, 
        isError,
        refetch,
        dataUpdatedAt
    } = useQuery<BusArrivalResult[]>({
        queryKey: ['busArrivals', DEFAULT_STATION_IDS],
        queryFn: () => fetchMultipleStationArrivals(DEFAULT_STATION_IDS),
        refetchInterval: 5 * 60 * 1000, // 5분
        staleTime: 60 * 1000, // 1분간은 캐시 유지
    });

    const error = isError ? '버스 정보를 불러오지 못했습니다.' : null;
    const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
    const updatedTime = lastUpdated
        ? `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')} 기준`
        : '';

    const selectedStationData = arrivals.find((s) => s.stationId === selectedStationId);
    const displayArrivals: BusArrivalItem[] = selectedStationData
        ? [...selectedStationData.arrivals].slice(0, 5) // 해당 정류장 버스 최대 5개 표시
        : [];

    return {
        arrivals,
        isLoading,
        error,
        updatedTime,
        selectedStationId,
        setSelectedStationId,
        isModalVisible,
        setIsModalVisible,
        favoriteStationId,
        toggleFavorite,
        loadArrivals: refetch, // 수동 갱신용 함수
        selectedStationData,
        displayArrivals,
    };
};
