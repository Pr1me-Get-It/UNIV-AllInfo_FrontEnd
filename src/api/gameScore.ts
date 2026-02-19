import { api } from './client';
import { AxiosResponse } from 'axios';

// 게임 점수 데이터 인터페이스
export interface GameScore {
    id?: number; // Added optional id
    user_id?: number; // Added optional user_id for dedup
    email: string;
    gameId: number;
    score: number;
    metadata?: object;
    createdAt?: string;
}

// 상위 점수 응답 인터페이스
export interface TopScoreResponse {
    success: boolean;
    scores: GameScore[];
}

// 점수 저장 응답 인터페이스
export interface SaveScoreResponse {
    success: boolean;
    insertId: number;
}

// 최고 점수 응답 인터페이스
export interface BestScoreResponse {
    email: string;
    gameId: number;
    bestScore: number;
}


/**
 * 게임 점수 저장
 * @param email 유저 이메일
 * @param gameId 게임 ID (Flappy Bird: 1)
 * @param score 점수
 * @param metadata 추가 정보 (선택)
 */
export const saveScore = async (
    email: string,
    gameId: number,
    score: number,
    metadata?: object
): Promise<AxiosResponse<SaveScoreResponse>> => {
    return await api.post('/gamescore', { email, gameId, score, metadata });
};

/**
 * 특정 유저의 플레이 기록 조회
 * @param email 유저 이메일
 */
export const getUserGameScores = async (email: string): Promise<AxiosResponse<GameScore[]>> => {
    // GET 요청이지만 body에 데이터를 보내야 하는 경우(비표준), axios에서는 config.data를 사용하거나
    // 백엔드가 쿼리 파라미터를 지원하는지 확인 필요.
    // 사용자의 요청 명세: Method: GET, Request body JSON: { "email": string }
    // 일부 서버/프록시는 GET 요청의 Body를 무시할 수 있음. 만약 동작하지 않으면 백엔드 수정 필요.
    return await api.get('/gamescore/user', {
        data: { email }
    });
};

/**
 * 게임별 상위 점수 목록 조회
 * @param gameId 게임 ID
 * @param limit 조회할 개수
 */
export const getTopScores = async (
    gameId: number,
    limit: number
): Promise<AxiosResponse<GameScore[]>> => {
    return await api.get(`/gamescore/top?gameId=${gameId}&limit=${limit}`);
};

/**
 * 유저의 최고점 조회
 * @param gameId 게임 ID
 * @param email 유저 이메일
 */
export const getBestScore = async (
    gameId: number,
    email: string
): Promise<AxiosResponse<BestScoreResponse>> => {
    // 명세: Method: GET, Request body JSON: { "email": string }
    // GET 요청에서 Body를 보내는 것은 비표준이므로, 쿼리 파라미터로도 전달 시도
    return await api.get(`/gamescore/best?gameId=${gameId}&email=${email}`);
};

/**
 * 게임 점수 삭제 (개발자 전용)
 * @param scoreId 삭제할 점수 ID
 */
export const deleteScore = async (scoreId: number): Promise<AxiosResponse<any>> => {
    // 404 오류 해결 시도: Body 대신 Path Parameter 사용 (/gamescore/:id)
    return await api.delete(`/gamescore/${scoreId}`);
};
