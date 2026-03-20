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
    title: 'LMS',
    url: 'https://lms1.knu.ac.kr/',
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
    title: '생활관',
    url: 'https://dormt.knu.ac.kr/webview/main/Main.knu',
    icon: 'bed-outline',
  },
  {
    id: 'knu_mail',
    title: '웹메일',
    url: 'https://mail.knu.ac.kr/',
    icon: 'mail-outline',
  },
  {
    id: 'knu_total_info',
    title: '통합정보시스템',
    url: 'https://knuin.knu.ac.kr/',
    icon: 'information-circle-outline',
  },
  {
    id: 'knu_cube',
    title: 'KNU CUBE',
    url: 'https://knucube.knu.ac.kr/knucube_index.jsp',
    icon: 'cube-outline',
  },
  {
    id: 'knu_safe',
    title: '연구실안전관리시스템',
    url: 'https://safe.knu.ac.kr/',
    icon: 'medkit-outline',
  },
  {
    id: 'knu_human_right',
    title: '경북대 인권센터',
    url: 'https://hrcedu.knu.ac.kr/',
    icon: 'people-outline',
  },
  {
    id: 'knu_swedu',
    title: 'SW교육센터',
    url: 'https://swedu.knu.ac.kr/',
    icon: 'code-outline',
  },
  {
    id: 'knu_changup_center',
    title: '창업교육센터 공지',
    url: 'https://changup.knu.ac.kr/changup/Board?menuId=MENU_CHANGUP0051',
    icon: 'bulb-outline',
  },
  {
    id: 'knu_international',
    title: '국제교류처',
    url: 'https://international.knu.ac.kr/',
    icon: 'earth-outline',
  },
  {
    id: 'knu_job',
    title: '진로취업과',
    url: 'https://knujob.knu.ac.kr/',
    icon: 'briefcase-outline',
  },
  {
    id: 'knu_welfare',
    title: '장학복지제도',
    url: 'https://ssw.knu.ac.kr/',
    icon: 'wallet-outline',
  },
  {
    id: 'knu_lang',
    title: '언어교육센터',
    url: 'https://lang.knu.ac.kr/hmpg/main/main.knu',
    icon: 'language-outline',
  },
  {
    id: 'knu_sports',
    title: '체육진흥센터',
    url: 'http://sports.knu.ac.kr/',
    icon: 'football-outline',
  },
  {
    id: 'knu_human',
    title: '경북대 인재원(포항)',
    url: 'https://human.knu.ac.kr/',
    icon: 'business-outline',
  },
  {
    id: 'knu_coop',
    title: '생활협동조합(COOP)',
    url: 'http://coop.knu.ac.kr/',
    icon: 'cart-outline',
  },
  {
    id: 'knu_startup',
    title: '창업지원단',
    url: 'https://startup.knu.ac.kr/bbs/board.php?bo_table=noti2&page=1',
    icon: 'rocket-outline',
  },
  {
    id: 'knu_grad',
    title: '대학원',
    url: 'https://grad.knu.ac.kr/',
    icon: 'school-outline',
  },

];
