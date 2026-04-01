export const normalizeSearchValue = (value = '') =>
    String(value || '').toLowerCase().replace(/\s+/g, '');

export const matchesNormalizedSearch = (value, query) => {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) return true;
    return normalizeSearchValue(value).includes(normalizedQuery);
};
