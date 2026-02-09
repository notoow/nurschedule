import * as XLSX from 'xlsx-js-style';
import { Resource } from '@/lib/engine/types';

// Helper: Excel Date -> JS Date String (YYYY-MM-DD)
const excelDateToJSDate = (serial: number | string): string => {
    if (typeof serial === 'string') return serial; // 이미 문자열이면 그대로
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
};

// Helper: Safe Parse Int
const safeParseInt = (val: any, def: number): number => {
    if (val === undefined || val === null || val === '') return def;
    const n = Number(val);
    return isNaN(n) ? def : n;
};

// Helper: Text Role -> Numeric Level (1~6)
const parseLevel = (raw: string): number => {
    const s = String(raw).trim();
    if (s.includes('수') || s.includes('Head')) return 6;
    if (s.includes('책임') || s.includes('Charge')) return 5;
    if (s.includes('주임') || s.includes('Senior')) return 4;
    if (s.includes('일반') || s.includes('Junior')) return 3;
    if (s.includes('신규') || s.includes('Newbie')) return 2;
    return 1; // Default
};

/**
 * PDR 2.0 Spec Compliant Excel Importer
 */
export interface ImportResult {
    resources: Resource[];
    schedule?: Uint8Array;
    meta?: {
        startDate: string;
        days: number;
    };
}

/**
 * PDR 3.0 Full State Importer
 * Supports both Legacy (Heuristic) and Full Config (Serialized) imports.
 */
export const cleanAndParseExcel = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, {
                    type: 'array',
                    cellDates: true,
                    codepage: 65001
                });

                // Strategy 1: Look for "Staff Config" (Full State Restore)
                if (workbook.SheetNames.includes("Staff Config")) {
                    const wsConfig = workbook.Sheets["Staff Config"];
                    const configRows: any[] = XLSX.utils.sheet_to_json(wsConfig);

                    const resources: Resource[] = configRows.map(row => {
                        let parsedRequests: Record<string, string> = {};
                        try {
                            if (row['Requests']) {
                                parsedRequests = JSON.parse(String(row['Requests']));
                            }
                        } catch (e) { console.warn('Excel Import: Failed to parse requests', e); }

                        return {
                            id: row['ID'] || `restored_${Date.now()}_${Math.random()}`,
                            name: row['Name'],
                            team: row['Team'] || 'A',
                            level: Number(row['Level'] || 1),
                            targetNight: Number(row['TargetNight'] || 0),
                            targetEvening: Number(row['TargetEvening'] || 0),
                            minOff: Number(row['MinOff'] || 8),
                            isPreceptor: row['IsPreceptor'] === 'Yes',
                            excludeFromCount: row['ExcludeFromCount'] === 'Yes',
                            onTraining: row['OnTraining'] || undefined,
                            fixedShift: row['FixedShift'] || undefined,
                            forbiddenShifts: row['ForbiddenShifts'] ? String(row['ForbiddenShifts']).split(',').filter(s => s) : [],
                            isWeekdayDayOnly: row['IsWeekdayDayOnly'] === 'Yes',
                            prevShift: row['PrevShift'] ? String(row['PrevShift']) : '0',
                            requests: parsedRequests
                        };
                    });

                    // Metadata
                    let meta = undefined;
                    if (workbook.SheetNames.includes("Metadata")) {
                        const wsMeta = workbook.Sheets["Metadata"];
                        const metaRows: any[] = XLSX.utils.sheet_to_json(wsMeta);
                        const metaMap = new Map(metaRows.map(r => [r.Key, r.Value]));

                        if (metaMap.has('StartDate') && metaMap.has('Days')) {
                            meta = {
                                startDate: String(metaMap.get('StartDate')),
                                days: Number(metaMap.get('Days'))
                            };
                        }
                    }

                    // Restore Schedule (Raw)
                    let schedule: Uint8Array | undefined = undefined;
                    if (workbook.SheetNames.includes("Schedule Raw") && meta) {
                        const wsSch = workbook.Sheets["Schedule Raw"];
                        const schRows: any[] = XLSX.utils.sheet_to_json(wsSch);
                        const size = resources.length * meta.days;
                        schedule = new Uint8Array(size);

                        // Map rows to resources by ID
                        const resourceIdMap = new Map<string, number>();
                        resources.forEach((r, idx) => resourceIdMap.set(r.id, idx));

                        schRows.forEach(row => {
                            const rID = row['ID'];
                            const rIdx = resourceIdMap.get(rID);
                            if (rIdx !== undefined) {
                                for (let d = 0; d < meta!.days; d++) {
                                    const val = row[`D${d + 1}`];
                                    if (val !== undefined) {
                                        schedule![rIdx * meta!.days + d] = Number(val);
                                    }
                                }
                            }
                        });
                    }

                    resolve({ resources, meta, schedule });
                    return;
                }

                // Strategy 2: Legacy Heuristic Import (First Sheet)
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                // 동명이인 처리 맵
                const nameCountMap = new Map<string, number>();

                const resources: Resource[] = jsonData.map((row, idx) => {
                    // 1. Name Normalization
                    let baseName = row['성명'] || row['이름'] || row['Name'] || `Nurse ${idx + 1}`;
                    baseName = String(baseName).trim();

                    let finalName = baseName;
                    if (nameCountMap.has(baseName)) {
                        const count = nameCountMap.get(baseName)! + 1;
                        nameCountMap.set(baseName, count);
                        finalName = `${baseName}(${count})`;
                    } else {
                        nameCountMap.set(baseName, 1);
                    }

                    // 2. Level Parsing
                    const rawRole = row['직급'] || row['Role'] || row['Level'] || 'Junior';
                    const level = parseLevel(rawRole);

                    // 5. Optional Params Parsing
                    const rawTN = row['TargetNight'] || row['나이트수'];
                    const rawTE = row['TargetEvening'] || row['이브닝수'];
                    const rawMO = row['MinOff'] || row['최소오프'];

                    const defaultTN = level === 6 ? 0 : 5;
                    const defaultTE = level === 6 ? 0 : 5;

                    // 3. Team Parsing (Optional)
                    const rawTeam = row['팀'] || row['Team'] || (idx % 2 === 0 ? 'A' : 'B');

                    // 4. Prev Shift Parsing
                    const rawPrev = row['지난달'] || row['전월'] || row['LastShift'] || row['Prev'] || row['PrevShift'] || 'O';
                    let prevCode = '0'; // Default Off
                    const s = String(rawPrev).trim().toUpperCase();
                    if (['D', '데이', '1'].includes(s)) prevCode = '1';
                    if (['E', '이브닝', '2'].includes(s)) prevCode = '2';
                    if (['N', '나이트', '3'].includes(s)) prevCode = '3';

                    return {
                        id: `imported_${Date.now()}_${idx}`,
                        name: finalName,
                        team: String(rawTeam).toUpperCase(),
                        level: level,
                        targetNight: safeParseInt(rawTN, defaultTN),
                        targetEvening: safeParseInt(rawTE, defaultTE),
                        minOff: safeParseInt(rawMO, 8),
                        isPreceptor: level >= 5,
                        excludeFromCount: false,
                        forbiddenShifts: [],
                        prevShift: prevCode,
                        requests: {}
                    };
                });

                // Strategy 2.1: Look for optional "Requests" sheet (Matrix Format)
                const reqSheetName = workbook.SheetNames.find(n =>
                    ['Requests', '신청근무', 'Shift Requests', 'Wishes'].includes(n)
                );

                if (reqSheetName) {
                    const wsReq = workbook.Sheets[reqSheetName];
                    const reqRows: any[] = XLSX.utils.sheet_to_json(wsReq);

                    reqRows.forEach(row => {
                        const name = row['성명'] || row['이름'] || row['Name'];
                        if (!name) return;

                        // Helper: normalized name check needed? usually template matches exactly.
                        // Simple trim check for now.
                        const cleanName = String(name).trim();
                        // Note: resources might have (2) suffix if duplicate. 
                        // We assume user template names are unique or match what they put in sheet 1.
                        const resource = resources.find(r => r.name.replace(/\(\d+\)$/, '') === cleanName || r.name === cleanName);

                        if (resource) {
                            for (let d = 1; d <= 31; d++) {
                                const val = row[String(d)] || row[`${d}일`];
                                if (val) {
                                    const s = String(val).trim().toUpperCase();
                                    let code: string | undefined = undefined;
                                    if (['D', '데이', '1'].includes(s)) code = 'D';
                                    if (['E', '이브닝', '2'].includes(s)) code = 'E';
                                    if (['N', '나이트', '3'].includes(s)) code = 'N';
                                    if (['O', '오프', 'OFF', '휴', '0'].includes(s)) code = 'O';

                                    if (code) {
                                        resource.requests[d - 1] = code; // 0-indexed
                                    }
                                }
                            }
                        }
                    });
                }

                resolve({ resources, meta: undefined }); // No metadata in legacy

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
