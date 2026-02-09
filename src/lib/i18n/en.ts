export const tokens = {
    common: {
        confirm: "Confirm",
        cancel: "Cancel",
        delete: "Delete",
        save: "Save",
        share: "Share / Print",
        export: "Excel Export",
    },

    sidebar: {
        brand: "NurSchedule",
        mainMenu: "Main Menu",
        menu: {
            staff: "Staff Management",
            config: "Shift Setup",
            roster: "Roster Table",
        },
        footer: {
            copyright: "© 2026 NurSchedule AI",
        }
    },
    staffView: {
        title: "Staff Management",
        subtitle: "Manage your nursing team roster.",
        addStaff: "Add Nurse",
        empty: {
            title: "No staff members registered.",
            action: "Start Adding Staff"
        },
        card: {
            level: "Level",
            minOff: "Min Off",
            fixed: "Fixed",
            exclude: "Exclude Count"
        }
    },
    // ... 더 추가될 예정
};

export type I18nTokens = typeof tokens;
