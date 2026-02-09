import * as XLSX from 'xlsx-js-style';
import { ScheduleMatrix, Resource } from '../engine/types';

// 스타일 정의 (박수쌤을 위한 시각적 배려)
const STYLES = {
    HEADER: {
        fill: { fgColor: { rgb: "E0F2F1" } }, // Teal-50
        font: { bold: true, color: { rgb: "004D40" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { bottom: { style: "thin", color: { rgb: "009688" } } }
    },
    CELL_BASE: {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            right: { style: "hair", color: { rgb: "E0E0E0" } },
            bottom: { style: "hair", color: { rgb: "E0E0E0" } }
        }
    },
    SHIFT_D: { fill: { fgColor: { rgb: "E3F2FD" } }, font: { color: { rgb: "1565C0" }, bold: true } }, // Blue
    SHIFT_E: { fill: { fgColor: { rgb: "E8F5E9" } }, font: { color: { rgb: "2E7D32" }, bold: true } }, // Green
    SHIFT_N: { fill: { fgColor: { rgb: "FFEBEE" } }, font: { color: { rgb: "C62828" }, bold: true } }, // Red
    SHIFT_O: { fill: { fgColor: { rgb: "FAFAFA" } }, font: { color: { rgb: "BDBDBD" } } }  // Gray (Off)
};

const SHIFT_MAP = ['O', 'D', 'E', 'N']; // 0, 1, 2, 3

export const exportScheduleToExcel = (
    resources: Resource[],
    days: number,
    schedule: ScheduleMatrix,
    startDate: string
) => {
    // 1. Workbook 생성
    const wb = XLSX.utils.book_new();

    // 2. Data Preparation (Header Row)
    const headers = ['Nurse ID', 'Name', ...Array.from({ length: days }, (_, i) => `${i + 1}`)];
    const wsData = [
        headers.map(h => ({ v: h, s: STYLES.HEADER }))
    ];

    // 3. Body Rows
    resources.forEach((nurse, nIdx) => {
        const rowData: any[] = [
            { v: nurse.id, s: STYLES.CELL_BASE },
            { v: nurse.name, s: { ...STYLES.CELL_BASE, font: { bold: true } } }
        ];

        for (let d = 0; d < days; d++) {
            const shiftCode = schedule[nIdx * days + d];
            const shiftChar = SHIFT_MAP[shiftCode] || '?';

            // 조건부 스타일링 적용
            let cellStyle = { ...STYLES.CELL_BASE };
            if (shiftCode === 1) cellStyle = { ...cellStyle, ...STYLES.SHIFT_D };
            if (shiftCode === 2) cellStyle = { ...cellStyle, ...STYLES.SHIFT_E };
            if (shiftCode === 3) cellStyle = { ...cellStyle, ...STYLES.SHIFT_N };
            if (shiftCode === 0) cellStyle = { ...cellStyle, ...STYLES.SHIFT_O };

            rowData.push({ v: shiftChar, s: cellStyle });
        }
        wsData.push(rowData);
    });

    // 4. Create Worksheet with Styles
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 강제 스타일 적용 (aoa_to_sheet는 스타일을 일부 무시하므로 셀 단위 주입)
    wsData.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rIdx, c: cIdx });
            ws[cellAddress] = cell;
        });
    });

    // 범위 설정
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: days + 1, r: resources.length } });

    // 컬럼 너비 설정
    ws['!cols'] = [
        { wch: 10 }, // ID
        { wch: 15 }, // Name
        ...Array(days).fill({ wch: 3.5 }) // Days (Compact)
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Monthly Schedule");

    // --- SHEET 2: Staff Configuration (Deep Save) ---
    const configData = resources.map(r => ({
        ID: r.id,
        Name: r.name,
        Team: r.team,
        Level: r.level,
        TargetNight: r.targetNight,
        TargetEvening: r.targetEvening,
        MinOff: r.minOff,
        IsPreceptor: r.isPreceptor ? 'Yes' : 'No',
        ExcludeFromCount: r.excludeFromCount ? 'Yes' : 'No',
        OnTraining: r.onTraining || '',
        FixedShift: r.fixedShift || '',
        ForbiddenShifts: (r.forbiddenShifts || []).join(','),
        IsWeekdayDayOnly: r.isWeekdayDayOnly ? 'Yes' : 'No',
        PrevShift: r.prevShift || '0',
        Requests: JSON.stringify(r.requests || {})
    }));
    const wsConfig = XLSX.utils.json_to_sheet(configData);
    XLSX.utils.book_append_sheet(wb, wsConfig, "Staff Config");

    // --- SHEET 3: Metadata (Date, Days) ---
    const metaData = [
        { Key: 'StartDate', Value: startDate },
        { Key: 'Days', Value: days },
        { Key: 'ExportVersion', Value: '3.1' }
    ];
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");

    // --- SHEET 4: Schedule Raw (Numeric Restoration) ---
    const rawSchData = resources.map((r, i) => {
        const row: any = { ID: r.id };
        for (let d = 0; d < days; d++) {
            row[`D${d + 1}`] = schedule[i * days + d];
        }
        return row;
    });
    const wsRaw = XLSX.utils.json_to_sheet(rawSchData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Schedule Raw");

    // 5. Download Trigger
    XLSX.writeFile(wb, `NurSchedule_Result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
};

export const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Staff List
    const staffHeaders = ['Name', 'Level', 'Team', 'PrevShift', 'TargetNight', 'TargetEvening', 'MinOff'];
    const staffData = [
        ['Example Nurse(1)', 'Senior', 'A', 'N', 6, 6, 8],
        ['Example Nurse(2)', 'Junior', 'B', 'O', 5, 5, 9],
    ];

    // Add Help Text (Note)
    const staffSheetData = [
        ['[HELP] Level: Head/Charge/Senior/Junior/Newbie', '', '', '', '', '', ''],
        ['[HELP] PrevShift: D/E/N/O (Last day of previous month)', '', '', '', '', '', ''],
        staffHeaders,
        ...staffData
    ];

    const wsStaff = XLSX.utils.aoa_to_sheet(staffSheetData);

    // Adjust Col Width
    wsStaff['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];

    XLSX.utils.book_append_sheet(wb, wsStaff, "Staff List");

    // Sheet 2: Requests
    const reqHeaders = ['Name', ...Array.from({ length: 31 }, (_, i) => `${i + 1}`)];
    const reqData = [
        ['Example Nurse(1)', 'O', '', '', 'D', 'N'],
        ['Example Nurse(2)', '', 'OFF', '', '', ''],
    ];
    const reqSheetData = [
        ['[HELP] Names must match Staff List. Enter D, E, N, or OFF.', ...Array(30).fill('')],
        reqHeaders,
        ...reqData
    ];

    const wsReq = XLSX.utils.aoa_to_sheet(reqSheetData);
    wsReq['!cols'] = [{ wch: 20 }, ...Array(31).fill({ wch: 4 })];

    XLSX.utils.book_append_sheet(wb, wsReq, "Requests");

    XLSX.writeFile(wb, `NurSchedule_Template.xlsx`);
};
