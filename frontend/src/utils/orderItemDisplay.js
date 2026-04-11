const getVariantEntries = (variant) => {
  if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
    return [];
  }

  return Object.entries(variant).filter(([key, value]) => {
    return String(key || "").trim() && String(value || "").trim();
  });
};

const formatVariantValue = (key, value) => {
  const normalizedKey = String(key || "").trim().toLowerCase();
  const normalizedValue = String(value || "").trim();
  const lowerValue = normalizedValue.toLowerCase();

  if (normalizedKey.includes("ram") && !lowerValue.includes("ram")) {
    return `${normalizedValue} RAM`;
  }

  if ((normalizedKey.includes("rom") || normalizedKey.includes("storage")) && !/(rom|storage)/i.test(normalizedValue)) {
    return normalizedValue;
  }

  return normalizedValue;
};

export const getVariantDetails = (variant) => {
  return getVariantEntries(variant).map(([key, value]) => `${String(key).trim()}: ${String(value).trim()}`);
};

export const getOrderedItemDisplayName = (lineItem, fallbackName = "Product Item") => {
  const baseName = String(
    lineItem?.name || lineItem?.title || lineItem?.productName || fallbackName
  ).trim();

  const variantValues = getVariantEntries(lineItem?.variant).map(([key, value]) => formatVariantValue(key, value));
  if (variantValues.length === 0) {
    return baseName;
  }

  const lowerBaseName = baseName.toLowerCase();
  const missingValues = variantValues.filter((value) => !lowerBaseName.includes(value.toLowerCase()));

  if (missingValues.length === 0) {
    return baseName;
  }

  return `${baseName} (${missingValues.join(", ")})`;
};
