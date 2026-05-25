import axios from 'axios';
import { KNU_STATIONS } from '../constants/busStations';

// 공공데이터포털 대구버스정보시스템 API
// https://apis.data.go.kr/6270000/dbmsapi02/getRealtime02

const DAEGU_BUS_BASE_URL = 'https://apis.data.go.kr/6270000/dbmsapi02';
const SERVICE_KEY = process.env.EXPO_PUBLIC_DAEGU_BUS_API_KEY || '';

export interface BusArrivalItem {
    routeNo: string;        // 노선 번호 (예: "300")
    arrtime: number;        // 도착 예정 시간 (초)
    arrState: string;       // 상태 (예: "운행중", "곧도착")
    stopCnt: number;        // 남은 정류소 수
    directionDst: string;   // 방면 (종점 방향)
}

export interface BusArrivalResult {
    stationName: string;
    stationId: string;
    arrivals: BusArrivalItem[];
}

const busClient = axios.create({
    baseURL: DAEGU_BUS_BASE_URL,
    timeout: 10000,
    params: {
        serviceKey: SERVICE_KEY,
    },
});

/**
 * 특정 정류장의 실시간 버스 도착 정보를 조회합니다.
 */
export const fetchBusArrivals = async (stationId: string): Promise<BusArrivalItem[]> => {
    console.log(`[BusService] 정류장 ${stationId} 도착 정보 조회 중...`);

    const response = await busClient.get('/getRealtime02', {
        params: { bsId: stationId },
    });

    const body = response.data?.body;
    if (!body || !body.items) {
        console.warn(`[BusService] 정류장 ${stationId}: 응답 데이터 없음`);
        return [];
    }

    const arrivals: BusArrivalItem[] = [];
    body.items.forEach((item: any) => {
        if (item.arrList && Array.isArray(item.arrList)) {
            item.arrList.forEach((arr: any) => {
                arrivals.push({
                    routeNo: item.routeNo || arr.routeNo,
                    arrtime: arr.arrTime,
                    arrState: arr.arrState || '',
                    stopCnt: arr.bsGap || 0,
                    directionDst: '', // 종점 정보가 명확하지 않으므로 비워둠
                });
            });
        }
    });

    // 도착 시간 임박순으로 정렬
    arrivals.sort((a, b) => a.arrtime - b.arrtime);

    console.log(`[BusService] 정류장 ${stationId} 응답: ${arrivals.length}개 버스`);
    return arrivals;
};

/**
 * 여러 정류장의 도착 정보를 한번에 조회합니다.
 */
export const fetchMultipleStationArrivals = async (
    stationIds: string[]
): Promise<BusArrivalResult[]> => {
    const stationNames = Object.entries(KNU_STATIONS);

    const results = await Promise.allSettled(
        stationIds.map(async (stationId) => {
            const arrivals = await fetchBusArrivals(stationId);
            const nameEntry = stationNames.find(([, id]) => id === stationId);
            return {
                stationId,
                stationName: nameEntry ? nameEntry[0] : stationId,
                arrivals,
            } as BusArrivalResult;
        })
    );

    const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<BusArrivalResult> => r.status === 'fulfilled')
        .map((r) => r.value);

    // 요청한 정류장이 있는데 성공한 결과가 0개라면 에러를 발생시킵니다.
    if (stationIds.length > 0 && fulfilledResults.length === 0) {
        const rejectedReason = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw rejectedReason ? rejectedReason.reason : new Error('모든 정류장의 도착 정보를 불러오지 못했습니다.');
    }

    return fulfilledResults;
};

/** 도착 시간(초)을 사람이 읽기 좋은 문자열로 변환 */
export const formatArrivalTime = (seconds: number): string => {
    // 음수이거나 비정상적으로 큰 값(1시간 이상)이면 운행종료 처리
    if (seconds < 0 || seconds > 3600) return '운행종료';
    if (seconds <= 60) return '곧 도착';
    const minutes = Math.round(seconds / 60);
    return `약 ${minutes}분 후`;
};
