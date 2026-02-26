import axios from 'axios';

// 피드백은 인증(토큰/이메일) 없이 단순 전송
// → 공통 api 인스턴스의 Authorization 인터셉터를 우회하기 위해 별도 인스턴스 사용
const feedbackClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 서버에 피드백을 전송합니다.
 * POST /feedback { "feedback": string }
 * 인증 토큰 없이 익명으로 전송됩니다.
 */
export const sendFeedback = async (feedback: string): Promise<void> => {
  const payload = { feedback };
  console.log('[Feedback] 전송 시도 → POST /feedback, payload:', JSON.stringify(payload));

  const response = await feedbackClient.post('/feedback', payload);

  console.log('[Feedback] 전송 성공 ✅ 응답:', response.data);
};
