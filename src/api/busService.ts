import axios from 'axios';

// 공공데이터포털 대구버스정보시스템 API
// https://apis.data.go.kr/6270000/dbmsapi02/getRealtime02

const DAEGU_BUS_BASE_URL = 'https://apis.data.go.kr/6270000/dbmsapi02';
const SERVICE_KEY = process.env.EXPO_PUBLIC_DAEGU_BUS_API_KEY || '';

// 경북대 대구캠퍼스 주요 정류장 (bsId 형식 - getBasic02 API로 확인)
// wincId(5자리)가 아닌 bsId(10자리)를 stationId로 사용해야 함
export const KNU_STATIONS: Record<string, string> = {
    '경북대 경상대학앞': '7011010100',   // wincId: 00318
    '경북대 경상대학건너': '7011010200', // wincId: 00317
    '경북대정문건너': '7011010300',      // wincId: 20673
    '경북대정문앞': '7011010400',        // wincId: 21752
    '경북대서문건너': '7021022400',      // wincId: 21757
    '경북대체육센터앞': '7021022300',      // wincId: 21756
    '경북대체육센터건너2': '7021022200',   // wincId: 21711
    '경북대체육센터건너': '7021025700',    // wincId: 00349
    '경북대북문앞': '7021025800',        // wincId: 20697
    '경북대북문건너': '7021025900',      // wincId: 20696
    '경북대서문앞': '7021022500',        // wincId: 20719
};

// 기본 조회 정류장 목록 (홈화면 위젯용)
export const DEFAULT_STATION_IDS = [
    '7011010100', // 경상대학앞 (00318)
    '7011010200', // 경상대학건너 (00317)
    '7011010300', // 정문건너 (20673)
    '7011010400', // 정문앞 (21752)
    '7021022300',//경북대체육센터앞 (21756)
    '7021022200',//경북대체육센터건너2 (21711)
    '7021025700',//경북대체육센터건너 (00349)
    '7021025800',//경북대학교북문앞(20697)
    '7021025900',//경북대학교북문건너(20696)
    '7021022500',//경북대학교서문앞(20719)
    '7021022400',//경북대학교서문건너(20757)
];

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
