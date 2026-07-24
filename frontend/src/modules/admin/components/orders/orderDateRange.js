// Preset -> number of days back (null = no date filter, 'custom' handled separately)
export const DATE_RANGE_PRESETS = [
    { value: 'all', label: 'All Time', days: null },
    { value: 'today', label: 'Today', days: 0 },
    { value: '7', label: 'Last 7 Days', days: 6 },
    { value: '30', label: 'Last 30 Days', days: 29 },
    { value: '90', label: 'Last 90 Days', days: 89 },
    { value: 'custom', label: 'Custom Range', days: null }
];

const toInputDate = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().split('T')[0];
};

// Returns { startDate, endDate } as yyyy-mm-dd strings (backend widens endDate to end of day).
export const resolveDateRange = (preset, customStart, customEnd) => {
    if (preset === 'custom') {
        return { startDate: customStart || '', endDate: customEnd || '' };
    }

    const match = DATE_RANGE_PRESETS.find((entry) => entry.value === preset);
    if (!match || match.days === null) return { startDate: '', endDate: '' };

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - match.days);
    return { startDate: toInputDate(start), endDate: toInputDate(end) };
};
