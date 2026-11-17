const VALID_CATEGORIES = [
  "upper_body",
  "lower_body",
  "dress",
  "outerwear",
  "one_piece",
  "unknown"
];

const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "referrer",
  "tracking_id"
];

/**
 * Normalize product URL.
 *
 * Removes:
 * - URL fragments
 * - Unnecessary tracking parameters
 * - Duplicate trailing slashes
 *
 * Preserves other query parameters because
 * some retailers use them to identify products.
 */
export const normalizeProductUrl = (productUrl) => {
  if (!productUrl || typeof productUrl !== "string") {
    throw new Error("Product URL is required.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(productUrl.trim());
  } catch {
    throw new Error("Invalid product URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS product URLs are allowed.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("Product URLs cannot contain credentials.");
  }

  parsedUrl.hash = "";

  // Remove tracking parameters.
  for (const parameter of TRACKING_PARAMETERS) {
    parsedUrl.searchParams.delete(parameter);
  }

  // Normalize hostname.
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  // Remove default ports.
  if (
    (parsedUrl.protocol === "https:" && parsedUrl.port === "443") ||
    (parsedUrl.protocol === "http:" && parsedUrl.port === "80")
  ) {
    parsedUrl.port = "";
  }

  // Remove trailing slash, except for the root path.
  if (parsedUrl.pathname.length > 1) {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
  }

  // Sort remaining query parameters for consistency.
  parsedUrl.searchParams.sort();

  return parsedUrl.toString();
};

/**
 * Clean text values.
 */
export const normalizeText = (value, maxLength = 500) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

/**
 * Normalize product name.
 */
export const normalizeProductName = (name) => {
  return normalizeText(name, 200);
};

/**
 * Normalize brand name.
 */
export const normalizeBrand = (brand) => {
  return normalizeText(brand, 100);
};

/**
 * Normalize product description.
 */
export const normalizeDescription = (description) => {
  return normalizeText(description, 2000);
};

/**
 * Normalize product category.
 */
export const normalizeProductCategory = (category) => {
  if (typeof category !== "string") {
    return "unknown";
  }

  const normalizedCategory = category
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return VALID_CATEGORIES.includes(normalizedCategory)
    ? normalizedCategory
    : "unknown";
};

/**
 * Normalize product price.
 */
export const normalizePrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return null;
  }

  const numericPrice =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/,/g, "").trim());

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return null;
  }

  return Number(numericPrice.toFixed(2));
};

/**
 * Normalize currency.
 */
export const normalizeCurrency = (currency) => {
  if (typeof currency !== "string") {
    return "INR";
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  return /^[A-Z]{3}$/.test(normalizedCurrency)
    ? normalizedCurrency
    : "INR";
};

/**
 * Normalize product image URL.
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    const parsedUrl = new URL(imageUrl.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    if (parsedUrl.username || parsedUrl.password) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

/**
 * Normalize the complete extracted product object.
 */
export const normalizeProductData = (product) => {
  if (!product || typeof product !== "object") {
    throw new Error("Invalid product data.");
  }

  const normalizedUrl = normalizeProductUrl(product.productUrl);

  const productName = normalizeProductName(product.productName);

  if (!productName) {
    throw new Error("Product name is required.");
  }

  const imageUrl = normalizeImageUrl(product.imageUrl);

  if (!imageUrl) {
    throw new Error("A valid product image URL is required.");
  }

  let sourceDomain;

  try {
    sourceDomain = new URL(normalizedUrl).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    throw new Error("Unable to determine product source domain.");
  }

  return {
    productUrl: normalizedUrl,
    sourceDomain,
    productName,
    imageUrl,
    category: normalizeProductCategory(product.category),
    description: normalizeDescription(product.description),
    brand: normalizeBrand(product.brand),
    price: normalizePrice(product.price),
    currency: normalizeCurrency(product.currency)
  };
};

export default {
  normalizeProductUrl,
  normalizeText,
  normalizeProductName,
  normalizeBrand,
  normalizeDescription,
  normalizeProductCategory,
  normalizePrice,
  normalizeCurrency,
  normalizeImageUrl,
  normalizeProductData
};