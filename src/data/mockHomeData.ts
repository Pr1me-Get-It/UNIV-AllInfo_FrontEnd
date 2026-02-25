export interface MealMenu {
    id: string;
    restaurantName: string; // 예: 기숙사 식당, 학생회관
    time: '조식' | '중식' | '석식';
    menus: string[];
    price: string;
    isSoldOut?: boolean;
}

export const MOCK_MEALS: MealMenu[] = [
    {
        id: 'm1',
        restaurantName: '진로취업관 식당',
        time: '중식',
        menus: ['치즈돈까스', '미니우동', '배추김치', '야쿠르트'],
        price: '5,500원',
    },
    {
        id: 'm2',
        restaurantName: '기숙사 B동 식당',
        time: '중식',
        menus: ['제육볶음', '된장찌개', '상추쌈', '어묵볶음'],
        price: '4,500원',
    },
    {
        id: 'm3',
        restaurantName: '학생회관 1층',
        time: '석식',
        menus: ['참치마요덮밥', '계란국', '깍두기'],
        price: '4,000원',
    },
];

export interface BusInfo {
    id: string;
    type: 'shuttle' | 'city';
    routeName: string; // 예: 교내순환, 708, 814
    destination: string; // 종점/방향
    arrivalEstimate: string; // 예: "5분 후", "14:30"
    remainingStops?: string; // 예: "2번째 전"
}

export const MOCK_BUSES: BusInfo[] = [
    {
        id: 'b1',
        type: 'shuttle',
        routeName: '순환 A코스',
        destination: '본관 앞',
        arrivalEstimate: '약 3분 후',
    },
    {
        id: 'b2',
        type: 'shuttle',
        routeName: '야간 셔틀',
        destination: '정문',
        arrivalEstimate: '18:30 출발',
    },
    {
        id: 'b3',
        type: 'city',
        routeName: '708번',
        destination: '동대구역 방면',
        arrivalEstimate: '약 7분 전',
        remainingStops: '3번째 전',
    },
    {
        id: 'b4',
        type: 'city',
        routeName: '814번',
        destination: '범물동 방면',
        arrivalEstimate: '약 12분 전',
        remainingStops: '5번째 전',
    },
];
