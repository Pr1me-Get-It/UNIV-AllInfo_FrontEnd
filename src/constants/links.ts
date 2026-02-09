export interface ExternalLink {
    id: string;
    title: string;
    url: string;
    icon: string;
}

export const EXTERNAL_LINKS: ExternalLink[] = [
    {
        id: 'knu_main',
        title: '경북대학교 홈',
        url: 'https://www.knu.ac.kr',
        icon: 'home-outline', // Ionicons 등 아이콘 라이브러리 사용 시
    },
    {
        id: 'knu_plan',
        title: '수업시간표 및 강의계획서',
        url: 'https://knuin.knu.ac.kr/public/stddm/lectPlnInqr.knu',
        icon: 'calendar-outline',
    },
    {
        id: 'knu_score',
        title: '성적 조회',
        url: 'https://lssrq.knu.ac.kr/grads/login.knu',
        icon: 'bar-chart-outline',
    },
    {
        id: 'knu_sugang',
        title: '수강신청',
        url: 'https://sugang.knu.ac.kr/login.knu',
        icon: 'checkmark-done-outline',
    },
];
