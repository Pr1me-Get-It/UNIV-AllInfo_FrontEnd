export interface MapPin {
    id: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    type: 'facility' | 'administrative' | 'other' | 'door';
}

export const MAP_PINS: MapPin[] = [
    {
        id: 1,
        name: '본관',
        description: '대학 본부 및 행정실이 위치한 건물입니다.',
        latitude: 35.888753, // 초기 카메라 위치와 동일
        longitude: 128.610514,
        type: 'administrative',
    },
    {
        id: 2,
        name: '도서관',
        description: '중앙 도서관입니다. 열람실과 자료실이 있습니다.',
        latitude: 35.890753,
        longitude: 128.611514,
        type: 'facility',
    },
    {
        id: 3,
        name: '공과대학',
        description: '공대생들이 주로 수업을 듣는 건물입니다.',
        latitude: 35.887753,
        longitude: 128.608514,
        type: 'facility',
    },
    {
        id: 4,
        name: '학생회관',
        description: '동아리방, 식당, 편의점 등 편의시설이 있습니다.',
        latitude: 35.889753,
        longitude: 128.610514,
        type: 'other',
    },
    {
        id: 5,
        name: '쪽문',
        description: "맛집",
        latitude: 35.88567450358735,
        longitude: 128.60949763834014,
        type: 'door'
    },
    {
        id: 6,
        name: '정문',
        description: "정문",
        latitude: 35.88521913534531,
        longitude: 128.61461330186376,
        type: 'door'
    },
    {
        id: 7,
        name: '조은문',
        description: "조은문",
        latitude: 35.886492,
        longitude: 128.607211,
        type: 'door'
    },
    {
        id: 8,
        name: '솔로문',
        description: "솔로문",
        latitude: 35.88663928898665,
        longitude: 128.60558400113945,
        type: 'door'
    },
    {
        id: 9,
        name: '서문',
        description: "서문",
        latitude: 35.88849922017853,
        longitude: 128.60402366818494,
        type: 'door'
    },
    {
        id: 10,
        name: '수영장문',
        description: "수영장문",
        latitude: 35.89032908130712,
        longitude: 128.6053933396616,
        type: 'door'
    },
    {
        id: 11,
        name: '어린이집문',
        description: "어린이집문",
        latitude: 35.89086761085153,
        longitude: 128.6064467092043,
        type: 'door'
    },
    {
        id: 12,
        name: '수의대문',
        description: "수의대문",
        latitude: 35.88619824284261,
        longitude: 128.61293802069997,
        type: 'door'
    },
    {
        id: 13,
        name: '동문',
        description: "동문",
        latitude: 35.888403963613136,
        longitude: 128.61647481803254,
        type: 'door'
    },
    {
        id: 14,
        name: '나리문',
        description: "나리문",
        latitude: 35.88942092172424,
        longitude: 128.61630436296082,
        type: 'door'
    },
    {
        id: 15,
        name: '향토문',
        description: "향토문",
        latitude: 35.89090586123909,
        longitude: 128.61573529062383,
        type: 'door'
    },
    {
        id: 16,
        name: '텍문',
        description: "텍문",
        latitude: 35.89244104490436,
        longitude: 128.6148480461223,
        type: 'door'
    },
    {
        id: 17,
        name: '누리관문',
        description: "누리관문",
        latitude: 35.89381059746425,
        longitude: 128.61412122794587,
        type: 'door'
    },
    {
        id: 18,
        name: '농장문',
        description: "농장문",
        latitude: 35.894977014740384,
        longitude: 128.61229644362123,
        type: 'door'
    },
    {
        id: 19,
        name: '북문',
        description: "경대인의 핫플레이스",
        latitude: 35.89232937378317,
        longitude: 128.60937910605128,
        type: 'door'
    }
];
