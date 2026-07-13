export const mapWithConcurrency = async (items, mapper, concurrency = 4) => {
  const source = Array.isArray(items) ? items : [];
  if (source.length === 0) return [];

  const limit = Math.max(1, Number(concurrency) || 1);
  const results = new Array(source.length);
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= source.length) {
        return;
      }

      results[index] = await mapper(source[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, source.length) }, () => worker())
  );

  return results;
};
