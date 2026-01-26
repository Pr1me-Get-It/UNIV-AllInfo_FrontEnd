import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 5분 동안은 데이터를 '신선(fresh)'하다고 간주하여 다시 요청하지 않음
            staleTime: 1000 * 60 * 5,
            // 윈도우 포커스 시 자동으로 데이터를 갱신 (기본값: true)
            refetchOnWindowFocus: true,
            // 쿼리 실패 시 1번 재시도
            retry: 1,
        },
    },
});
