// 하드코딩된 규칙 체크 함수 제거 -> 패턴 매처를 일반화
// validator.ts 리팩토링 예정
/**
 * Dynamic Pattern Matcher
 * - 하드코딩된 isEtoD 대신, 제약 조건 설정에서 패턴을 주입받아 검사합니다.
 */

import { SlotId } from './types';

// 패턴 정의: [A, B] -> A 다음에 B가 오면 매칭
export type Pattern2 = [SlotId, SlotId];
// 패턴 정의: [A, B, C] -> A, B, C 순서면 매칭
export type Pattern3 = [SlotId, SlotId, SlotId];

export const DynamicMatcher = {
    // 2일 연속 패턴 검사 (예: E->D)
    match2: (prev: number, curr: number, pattern: Pattern2): boolean => {
        return prev === pattern[0] && curr === pattern[1];
    },

    // 3일 연속 패턴 검사 (예: N->O->D)
    match3: (d1: number, d2: number, d3: number, pattern: Pattern3): boolean => {
        return d1 === pattern[0] && d2 === pattern[1] && d3 === pattern[2];
    }
};
