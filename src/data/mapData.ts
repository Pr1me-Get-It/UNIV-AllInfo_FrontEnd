export interface MapPin {
    id: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    type: 'facility' | 'administrative' | 'other';
}

export const MAP_PINS: MapPin[] = [
    {
        id: 1,
        name: '본관',
        description: '대학 본부 및 행정실이 위치한 건물입니다.',
        latitude: 37.5509, // 예시 좌표 (추후 수정 필요)
        longitude: 127.0755,
        type: 'administrative',
    },
    {
        id: 2,
        name: '도서관',
        description: '중앙 도서관입니다. 열람실과 자료실이 있습니다.',
        latitude: 37.5515,
        longitude: 127.0760,
        type: 'facility',
    },
    {
        id: 3,
        name: '공과대학',
        description: '공대생들이 주로 수업을 듣는 건물입니다.',
        latitude: 37.5520,
        longitude: 127.0740,
        type: 'facility',
    },
    {
        id: 4,
        name: '학생회관',
        description: '동아리방, 식당, 편의점 등 편의시설이 있습니다.',
        latitude: 37.5505,
        longitude: 127.0750,
        type: 'other',
    },
];
