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
        const rawSource = item.source;
        const splitKey = rawSource?.split('/')[0];
        const displaySource =
          (SOURCE_LABELS as any)[splitKey] || rawSource?.replace('공지사항', '').trim();

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
