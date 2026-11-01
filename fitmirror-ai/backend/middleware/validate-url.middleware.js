import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";


const MAX_URL_LENGTH = 2048;

const ALLOWED_PROTOCOLS = [
  "http:",
  "https:",
];

const ALLOWED_PORTS = [
  "",
  "80",
  "443",
];

/**
 * Hostnames that must never be accessed.
 */
const BLOCKED_HOSTNAMES = [
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
];

/**
 * Check whether a hostname is local or internal.
 */
const isBlockedHostname = (hostname) => {
  const normalizedHost = hostname
    .toLowerCase()
    .replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.includes(normalizedHost)) {
    return true;
  }

  const blockedSuffixes = [
    ".localhost",
    ".local",
    ".internal",
    ".test",
    ".invalid",
  ];

  return blockedSuffixes.some((suffix) =>
    normalizedHost.endsWith(suffix)
  );
};

/**
 * Check whether an IP address is safe for public access.
 *
 * Only globally routable unicast addresses are accepted.
 */
const isPublicIPAddress = (address) => {
  try {
    const parsedAddress = ipaddr.process(address);

    return parsedAddress.range() === "unicast";
  } catch {
    return false;
  }
};

/**
 * Validate hostname and IP address.
 */
const validateHostname = async (hostname) => {
  // Reject empty hostnames
  if (!hostname) {
    return false;
  }

  // Reject localhost and internal hostnames
  if (isBlockedHostname(hostname)) {
    return false;
  }

  // Reject IP literals entirely.
  // Product URLs should use domain names.
  if (net.isIP(hostname)) {
    return false;
  }

  // Reject malformed domain names
  if (
    hostname.length > 253 ||
    !hostname.includes(".")
  ) {
    return false;
  }

  // Resolve all DNS records
  let addresses;

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    return false;
  }

  // Reject domains that do not resolve
  if (!addresses || addresses.length === 0) {
    return false;
  }

  /*
   * Reject the entire hostname if ANY resolved
   * address is private, reserved, or otherwise
   * not globally routable.
   */
  for (const record of addresses) {
    if (!isPublicIPAddress(record.address)) {
      return false;
    }
  }

  return true;
};

/**
 * Validate product URL.
 *
 * Middleware:
 * POST /api/products/extract
 */
export const validateProductUrl = async (
  req,
  res,
  next
) => {
  try {
    // Step 1: Read URL from request body
    const { productUrl } = req.body || {};

    // Step 2: Validate URL presence
    if (
      !productUrl ||
      typeof productUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a product URL.",
        errorCode: "PRODUCT_URL_REQUIRED",
      });
    }

    // Step 3: Remove unnecessary whitespace
    const cleanUrl = productUrl.trim();

    // Step 4: Validate URL length
    if (cleanUrl.length > MAX_URL_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Product URL is too long.",
        errorCode: "URL_TOO_LONG",
      });
    }

    // Step 5: Parse URL
    let parsedUrl;

    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid product URL.",
        errorCode: "INVALID_URL",
      });
    }

    // Step 6: Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP and HTTPS URLs are allowed.",
        errorCode: "INVALID_URL_PROTOCOL",
      });
    }

    // Step 7: Reject embedded credentials
    if (
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return res.status(400).json({
        success: false,
        message: "URLs containing credentials are not allowed.",
        errorCode: "URL_CREDENTIALS_NOT_ALLOWED",
      });
    }

    // Step 8: Validate port
    if (!ALLOWED_PORTS.includes(parsedUrl.port)) {
      return res.status(400).json({
        success: false,
        message: "This URL port is not allowed.",
        errorCode: "INVALID_URL_PORT",
      });
    }

    // Step 9: Validate hostname
    const hostname = parsedUrl.hostname
      .toLowerCase()
      .replace(/\.$/, "");

    const isValidHost = await validateHostname(hostname);

    if (!isValidHost) {
      return res.status(400).json({
        success: false,
        message: "This product URL is invalid or not allowed.",
        errorCode: "UNSAFE_PRODUCT_URL",
      });
    }

    // Step 10: Store validated URL for the controller
    req.validatedProductUrl = parsedUrl.toString();

    req.validatedProductHostname = hostname;

    // Step 11: Continue to product controller
    next();

  } catch (error) {
    console.error(
      "Product URL Validation Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to validate product URL.",
      errorCode: "URL_VALIDATION_FAILED",
    });
  }
};

export default validateProductUrl;