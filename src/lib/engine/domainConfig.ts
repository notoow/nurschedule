import { ConstraintConfig } from './types'; // 상대 경로 수정 (../types -> ./types)

/**
 * Domain Configuration Interface
 * - 도메인(간호, 보안, 물류 등)마다 달라지는 설정을 이곳에 정의합니다.
 */
export interface DomainConfig {
    name: string; // 'Nurse', 'Security', etc.

    // 슬롯 정의 (View Layer 용)
    slots: {
        [key: number]: { // SlotId
            code: string;  // 화면 표시 텍스트 ('D', '주간')
            name: string;  // 전체 이름 ('Day', '주간근무')
            color: string; // HEX Color
        }
    };

    // 해당 도메인에서 '기본적으로' 사용하는 제약 조건 리스트
    defaultConstraints: ConstraintConfig[];
}

/**
 * Empty Factory
 */
export const createEmptyDomainConfig = (): DomainConfig => ({
    name: 'Unknown',
    slots: {},
    defaultConstraints: []
});
