import axios from "axios";
import * as cheerio from "cheerio";

import Product from "../models/Product.js";
import { extractProductImage } from "./image-extractor.service.js";

const REQUEST_TIMEOUT = 10000;
const MAX_HTML_SIZE = 2 * 1024 * 1024;

// Supported clothing categories
const PRODUCT_CATEGORIES = [
  "upper_body",
  "lower_body",
  "dress",
  "outerwear",
  "one_piece",
  "unknown",
];

// Supported retailer domains
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

// Check whether a retailer is supported
const isSupportedRetailer = (hostname) => {
  const normalizedHost = hostname.toLowerCase();

  return SUPPORTED_RETAILERS.some(
    (domain) =>
      normalizedHost === domain ||
      normalizedHost.endsWith(`.${domain}`)
  );
};

// Normalize product URL
const normalizeProductUrl = (productUrl) => {
  if (!productUrl || typeof productUrl !== "string") {
    throw new Error("Product URL is required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(productUrl.trim());
  } catch {
    throw new Error("Invalid product URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  if (!isSupportedRetailer(parsedUrl.hostname)) {
    throw new Error("This retailer is not currently supported");
  }

  return parsedUrl;
};

// Extract retailer domain
const getSourceDomain = (hostname) => {
  return hostname.toLowerCase();
};

// Fetch retailer webpage
const fetchProductHtml = async (productUrl) => {
  const response = await axios.get(productUrl, {
    timeout: REQUEST_TIMEOUT,
    maxContentLength: MAX_HTML_SIZE,
    maxBodyLength: MAX_HTML_SIZE,
    maxRedirects: 0,
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
    throw new Error("Retailer did not return a valid HTML page");
  }

  return response.data;
};

// Get metadata from webpage
const getMetaContent = ($, selectors) => {
  for (const selector of selectors) {
    const value = $(selector).attr("content");

    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

// Extract product name
const extractProductName = ($) => {
  return (
    getMetaContent($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ]) ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    null
  );
};

// Extract product description
const extractProductDescription = ($) => {
  return (
    getMetaContent($, [
      'meta[property="og:description"]',
      'meta[name="description"]',
    ]) || ""
  );
};

// Extract product brand from JSON-LD
const extractProductBrand = ($) => {
  let brand = null;

  $('script[type="application/ld+json"]').each((_, element) => {
    if (brand) return;

    try {
      const data = JSON.parse($(element).text());

      const inspect = (item) => {
        if (!item || typeof item !== "object" || brand) return;

        if (Array.isArray(item)) {
          item.forEach(inspect);
          return;
        }

        const type = item["@type"];

        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && type.includes("Product"));

        if (isProduct && item.brand) {
          brand =
            typeof item.brand === "string"
              ? item.brand
              : item.brand.name || null;
        }

        if (item["@graph"]) inspect(item["@graph"]);
      };

      inspect(data);
    } catch {
      // Ignore invalid JSON-LD.
    }
  });

  return brand;
};

// Extract price from JSON-LD
const extractProductPrice = ($) => {
  let price = null;
  let currency = null;

  $('script[type="application/ld+json"]').each((_, element) => {
    if (price !== null) return;

    try {
      const data = JSON.parse($(element).text());

      const inspect = (item) => {
        if (!item || typeof item !== "object" || price !== null) return;

        if (Array.isArray(item)) {
          item.forEach(inspect);
          return;
        }

        const type = item["@type"];

        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && type.includes("Product"));

        if (isProduct && item.offers) {
          const offers = Array.isArray(item.offers)
            ? item.offers[0]
            : item.offers;

          const offerPrice = Number(offers.price);

          if (Number.isFinite(offerPrice) && offerPrice >= 0) {
            price = offerPrice;
            currency = offers.priceCurrency || null;
          }
        }

        if (item["@graph"]) inspect(item["@graph"]);
      };

      inspect(data);
    } catch {
      // Ignore invalid JSON-LD.
    }
  });

  return { price, currency };
};

// Extract category from product information
const detectProductCategory = (productName, description) => {
  const text = `${productName || ""} ${description || ""}`.toLowerCase();

  const categoryRules = [
    {
      category: "one_piece",
      keywords: ["jumpsuit", "romper", "playsuit"],
    },
    {
      category: "dress",
      keywords: ["dress", "gown", "maxi dress"],
    },
    {
      category: "outerwear",
      keywords: [
        "jacket",
        "coat",
        "blazer",
        "hoodie",
        "sweater",
        "cardigan",
      ],
    },
    {
      category: "lower_body",
      keywords: [
        "jeans",
        "trousers",
        "pants",
        "leggings",
        "shorts",
        "skirt",
      ],
    },
    {
      category: "upper_body",
      keywords: [
        "shirt",
        "t-shirt",
        "tshirt",
        "top",
        "blouse",
        "kurta",
        "sweatshirt",
      ],
    },
  ];

  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return "unknown";
};

// Normalize extracted product information
const normalizeProductData = (data) => {
  const category = PRODUCT_CATEGORIES.includes(data.category)
    ? data.category
    : "unknown";

  return {
    productUrl: data.productUrl,
    sourceDomain: data.sourceDomain,
    productName: data.productName,
    imageUrl: data.imageUrl,
    category,
    description: data.description || "",
    brand: data.brand || "",
    price: data.price ?? null,
    currency: data.currency || null,
  };
};

// Main product extraction service
export const extractProductDetails = async (productUrl) => {
  const parsedUrl = normalizeProductUrl(productUrl);

  const normalizedUrl = parsedUrl.href;

  // Check whether product already exists
  const existingProduct = await Product.findOne({
    productUrl: normalizedUrl,
  });

  if (existingProduct) {
    return {
      product: existingProduct,
      cached: true,
    };
  }

  // Fetch product webpage
  const html = await fetchProductHtml(normalizedUrl);

  const $ = cheerio.load(html);

  // Extract product information
  const productName = extractProductName($);

  if (!productName) {
    throw new Error("Unable to extract product name from retailer page");
  }

  const description = extractProductDescription($);

  const brand = extractProductBrand($);

  const { price, currency } = extractProductPrice($);

  // Extract product image
  const imageData = await extractProductImage(normalizedUrl);

  // Detect clothing category
  const category = detectProductCategory(
    productName,
    description
  );

  // Normalize product data
  const productData = normalizeProductData({
    productUrl: normalizedUrl,
    sourceDomain: getSourceDomain(parsedUrl.hostname),
    productName,
    imageUrl: imageData.imageUrl,
    description,
    brand,
    price,
    currency,
    category,
  });

  // Save product in MongoDB
  try {
    const product = await Product.create(productData);

    return {
      product,
      cached: false,
    };
  } catch (error) {
    // Handle simultaneous requests for the same URL
    if (error.code === 11000) {
      const existing = await Product.findOne({
        productUrl: normalizedUrl,
      });

      if (existing) {
        return {
          product: existing,
          cached: true,
        };
      }
    }

    throw error;
  }
};

export default {
  extractProductDetails,
};