import { api } from './client';
import SOURCE_LABELS from '../constants/labeltag.json';

const DEFAULT_IMAGE = require('../assets/knu.png');

export interface Notice {
  id: number;
  notice_id: number;
  title: string;
  source: string;
  displaySource: string;
  posted_at: string;
  date: string;
  link?: string;
  image: any;
}

export const fetchNotices = async ({ queryKey }: any): Promise<Notice[]> => {
  console.log('Using fetchNotices...');
  const [_, keyword] = queryKey;

  let pageNum = 1;
  let allFetchedData: Notice[] = [];
  let shouldContinue = true;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  while (shouldContinue) {
    const params: any = { p: pageNum, order: 'DESC', limit: 20 };
    if (keyword) params.keyword = keyword;

    try {
      const response = await api.get('/notice', { params });
      const rawData = response.data;
      const safeNotices = Array.isArray(rawData) ? rawData : [];

      if (safeNotices.length === 0) break;

      // 데이터 전처리
      const processedBatch = safeNotices.map((item: any) => {
        const rawSource = item.source || '';

        // 1. 구분자(/ 또는 |)로 분리 시도
        const parts = rawSource.split(/[\/|]/);
        const splitKey = parts[0]?.toUpperCase().trim();

        let deptName = (SOURCE_LABELS as any)[splitKey];
        let suffix = parts.length > 1 ? parts.slice(1).join('/') : '';

        // 2. 코드로 못 찾았으면, 이름으로 시작하는지 확인 (예: 음악학과학사공지 -> 음악학과)
        if (!deptName) {
          const foundCode = Object.keys(SOURCE_LABELS).find(code =>
            rawSource.startsWith((SOURCE_LABELS as any)[code])
          );
          if (foundCode) {
            deptName = (SOURCE_LABELS as any)[foundCode];
            // 학과명 뒤의 나머지를 suffix로 간주
            suffix = rawSource.substring(deptName.length);
          }
        }

        console.log(`Debug Mapping: raw=${rawSource}, dept=${deptName}, suffix=${suffix}`);

        let displaySource;
        if (deptName) {
          let cleanSuffix = suffix.trim();

          // 영어 키워드를 한글로 변환 (대소문자 무관)
          const lowerSuffix = cleanSuffix.toLowerCase();
          if (lowerSuffix.includes('notice')) cleanSuffix = '공지사항';
          else if (lowerSuffix.includes('seminar')) cleanSuffix = '세미나';
          else if (lowerSuffix.includes('information')) cleanSuffix = '정보';
          else if (lowerSuffix.includes('recruit') || lowerSuffix.includes('job')) cleanSuffix = '취업정보';
          else if (lowerSuffix.includes('.html') || lowerSuffix.includes('/')) {
            // 키워드 매칭 안된 경로 형식은 '공지사항'으로 퉁침 (혹은 필요시 추가)
            cleanSuffix = '공지사항';
          }

          // suffix가 없거나 '공지사항'이면 -> '공지사항'
          // suffix가 있으면(예: 취업정보) -> 그 내용 유지
          const finalSuffix = (cleanSuffix && cleanSuffix !== '공지사항') ? cleanSuffix : '공지사항';
          displaySource = `${deptName}/${finalSuffix}`;
        } else {
          // 매칭 안됨 -> 구분자만 통일
          displaySource = rawSource.replace(/\|/g, '/');
        }

        return {
          ...item,
          id: item.notice_id, // Use notice_id as id
          displaySource: displaySource,
          date: item.posted_at ? item.posted_at.split('T')[0] : '',
          image: DEFAULT_IMAGE,
        };
      });

      allFetchedData = [...allFetchedData, ...processedBatch];

      // 마지막 데이터가 한 달 전보다 오래됐으면 중단
      if (safeNotices.length > 0) {
        const oldestInBatch = new Date(safeNotices[safeNotices.length - 1].posted_at);
        if (oldestInBatch < oneMonthAgo || safeNotices.length < 20) {
          shouldContinue = false;
        } else {
          pageNum++;
        }
      } else {
        shouldContinue = false;
      }
    } catch (e) {
      console.error('Fetch notices error:', e);
      shouldContinue = false;
    }
  }

  return allFetchedData;
};
