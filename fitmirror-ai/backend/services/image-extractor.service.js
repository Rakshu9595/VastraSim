import axios from "axios";
import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";

const REQUEST_TIMEOUT = 10000;
const MAX_HTML_SIZE = 2 * 1024 * 1024;
const MAX_REDIRECTS = 0;

// Add supported retailer domains here.
// Use exact domains or their subdomains.
const SUPPORTED_RETAILERS = [
  "myntra.com",
  "ajio.com",
  "amazon.in",
  "amazon.com",
  "flipkart.com",
  "nykaafashion.com",
  "zara.com",
  "hm.com",
];

// Check whether a domain belongs to a supported retailer.
const isSupportedRetailer = (hostname) => {
  const normalizedHost = hostname.toLowerCase();

  return SUPPORTED_RETAILERS.some(
    (domain) =>
      normalizedHost === domain ||
      normalizedHost.endsWith(`.${domain}`)
  );
};

// Check whether an IP address is publicly routable.
const isPublicIP = (address) => {
  try {
    const parsedAddress = ipaddr.process(address);

    return parsedAddress.range() === "unicast";
  } catch {
    return false;
  }
};

// Resolve and validate the hostname.
const validateHostname = async (hostname) => {
  if (net.isIP(hostname)) {
    throw new Error("IP addresses are not allowed");
  }

  const records = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (!records.length) {
    throw new Error("Unable to resolve product website");
  }

  for (const record of records) {
    if (!isPublicIP(record.address)) {
      throw new Error("Product website resolves to a restricted IP");
    }
  }

  return records;
};

// Validate the product webpage URL.
const validatePageUrl = async (url) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid product URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  if (
    (parsedUrl.protocol === "http:" && parsedUrl.port && parsedUrl.port !== "80") ||
    (parsedUrl.protocol === "https:" && parsedUrl.port && parsedUrl.port !== "443")
  ) {
    throw new Error("Custom ports are not allowed");
  }

  if (!isSupportedRetailer(parsedUrl.hostname)) {
    throw new Error("This retailer is not currently supported");
  }

  await validateHostname(parsedUrl.hostname);

  return parsedUrl;
};

// Fetch HTML from the retailer.
const fetchProductPage = async (url) => {
  const parsedUrl = await validatePageUrl(url);

  const response = await axios.get(parsedUrl.href, {
    timeout: REQUEST_TIMEOUT,

    maxContentLength: MAX_HTML_SIZE,
    maxBodyLength: MAX_HTML_SIZE,

    maxRedirects: MAX_REDIRECTS,

    responseType: "text",

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",

      Accept: "text/html,application/xhtml+xml",

      "Accept-Language": "en-US,en;q=0.9",
    },

    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = response.headers["content-type"] || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("Retailer did not return an HTML webpage");
  }

  return response.data;
};

// Read metadata from HTML.
const getMetaContent = ($, selectors) => {
  for (const selector of selectors) {
    const value = $(selector).attr("content");

    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

// Normalize image URL.
const normalizeImageUrl = (imageUrl, pageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    const normalizedUrl = new URL(imageUrl, pageUrl);

    if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
      return null;
    }

    if (normalizedUrl.username || normalizedUrl.password) {
      return null;
    }

    return normalizedUrl.href;
  } catch {
    return null;
  }
};

// Extract images from JSON-LD structured data.
const extractJsonLdImages = ($) => {
  const images = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).text());

      const collectImages = (item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        if (Array.isArray(item)) {
          item.forEach(collectImages);
          return;
        }

        const type = item["@type"];

        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && type.includes("Product"));

        if (isProduct && item.image) {
          const productImages = Array.isArray(item.image)
            ? item.image
            : [item.image];

          for (const image of productImages) {
            if (typeof image === "string") {
              images.push(image);
            } else if (image && typeof image === "object") {
              if (image.url) images.push(image.url);
              if (image.contentUrl) images.push(image.contentUrl);
            }
          }
        }

        if (item["@graph"]) {
          collectImages(item["@graph"]);
        }

        if (item.itemListElement) {
          collectImages(item.itemListElement);
        }
      };

      collectImages(data);
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  });

  return images;
};

// Extract fallback images from HTML.
const extractHtmlImages = ($) => {
  const images = [];

  $("img").each((_, element) => {
    const image =
      $(element).attr("data-src") ||
      $(element).attr("data-original") ||
      $(element).attr("src");

    if (image) {
      images.push(image);
    }
  });

  return images;
};

// Select the best available product image.
const selectProductImage = ($, pageUrl) => {
  const metadataImage = getMetaContent($, [
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
  ]);

  const jsonLdImages = extractJsonLdImages($);
  const htmlImages = extractHtmlImages($);

  const candidates = [
    metadataImage,
    ...jsonLdImages,
    ...htmlImages,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate, pageUrl);

    if (normalized) {
      return normalized;
    }
  }

  return null;
};

// Main image extraction function.
export const extractProductImage = async (productUrl) => {
  if (!productUrl || typeof productUrl !== "string") {
    throw new Error("Product URL is required");
  }

  const html = await fetchProductPage(productUrl);

  const $ = cheerio.load(html);

  const imageUrl = selectProductImage($, productUrl);

  if (!imageUrl) {
    throw new Error(
      "Unable to find a product image. Please upload the garment manually."
    );
  }

  return {
    imageUrl,
    sourceUrl: productUrl,
    extractedAt: new Date(),
  };
};

export default {
  extractProductImage,
};