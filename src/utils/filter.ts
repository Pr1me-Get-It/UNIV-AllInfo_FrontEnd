/**
 * 한국어 비속어 필터링 유틸리티 파일
 */

const Filter = require('badwords-ko');
const filter = new Filter();

/**
 * 주어진 텍스트가 욕설이나 부적절한 단어를 포함하는지 검사합니다.
 * @param text 검사할 문자열 (예: 닉네임)
 * @returns {boolean} 불건전한 단어가 없다면 true, 있다면 false
 */
export const isValidNickname = (text: string): boolean => {
    if (!text) return false;
    // 필터링 적용 후의 텍스트가 원본과 같다면 비속어가 없다는 뜻입니다.
    return filter.clean(text) === text;
};
