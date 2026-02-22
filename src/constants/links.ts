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

export const AVAILABLE_LINKS: ExternalLink[] = [
    {
        id: 'knu_main',
        title: '경북대학교 홈',
        url: 'https://www.knu.ac.kr',
        icon: 'home-outline',
    },
    {
        id: 'knu_plan',
        title: '강의계획서',
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
    {
        id: 'knu_eruri',
        title: 'LMS (e루리)',
        url: 'https://eruri.knu.ac.kr/',
        icon: 'laptop-outline',
    },
    {
        id: 'knu_library',
        title: '중앙도서관',
        url: 'https://knul.knu.ac.kr/',
        icon: 'book-outline',
    },
    {
        id: 'knu_dorm',
        title: '생활관 (기숙사)',
        url: 'https://dorm.knu.ac.kr/',
        icon: 'bed-outline',
    },
    {
        id: 'knu_mail',
        title: '웹메일',
        url: 'https://mail.knu.ac.kr/',
        icon: 'mail-outline',
    }
];
