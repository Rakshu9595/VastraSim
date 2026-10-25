import Product from "../models/Product.js";
import { extractProductDetails } from "../services/product.service.js";

/**
 * @desc    Extract product information from an e-commerce URL
 * @route   POST /api/products/extract
 * @access  Public (rate-limited)
 */
export const extractProduct = async (req, res) => {
  try {
    // Step 1: Get the product URL from the request body
    const { productUrl } = req.body || {};

    // Step 2: Check whether the URL was provided
    if (!productUrl || typeof productUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid product URL.",
      });
    }

    // Step 3: Remove unnecessary whitespace
    const cleanUrl = productUrl.trim();

    // Step 4: Validate URL format
    let parsedUrl;

    try {
      parsedUrl = new URL(cleanUrl);

      if (
        !["http:", "https:"].includes(parsedUrl.protocol)
      ) {
        return res.status(400).json({
          success: false,
          message: "Only HTTP and HTTPS URLs are supported.",
        });
      }

      if (
        parsedUrl.username ||
        parsedUrl.password ||
        cleanUrl.length > 2048
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product URL.",
        });
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format. Please check the product link.",
      });
    }

    // Step 5: Extract product information
    // The service must validate network destinations and redirects
    // before making any external HTTP requests.
    const productData = await extractProductDetails(cleanUrl);

    // Step 6: Check extraction result
    if (
      !productData ||
      !productData.productName ||
      !productData.imageUrl
    ) {
      return res.status(422).json({
        success: false,
        message:
          "Unable to extract product details. Please upload the garment image manually.",
        manualUploadAvailable: true,
      });
    }

    // Step 7: Prepare product information
    const normalizedProduct = {
      productUrl: cleanUrl,
      sourceDomain: parsedUrl.hostname.toLowerCase(),
      productName: productData.productName,
      imageUrl: productData.imageUrl,
      category: ["tops", "bottoms", "one-pieces"].includes(
        productData.category
      )
        ? productData.category
        : null,
    };

    // Step 8: Save or update the product in MongoDB
    const product = await Product.findOneAndUpdate(
      { productUrl: cleanUrl },
      { $set: normalizedProduct },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Step 9: Return extracted product information
    return res.status(200).json({
      success: true,
      message: "Product extracted successfully.",
      data: {
        productId: product._id,
        productName: product.productName,
        productUrl: product.productUrl,
        sourceDomain: product.sourceDomain,
        imageUrl: product.imageUrl,
        category: product.category,
      },
    });

  } catch (error) {
    console.error("Product Extraction Error:", error.message);

    // Handle URL validation or blocked destinations
    if (
      error.code === "INVALID_PRODUCT_URL" ||
      error.code === "UNSAFE_PRODUCT_URL"
    ) {
      return res.status(400).json({
        success: false,
        message: "The provided product URL is invalid or not allowed.",
      });
    }

    // Handle blocked or inaccessible product pages
    if (
      error.code === "PRODUCT_EXTRACTION_FAILED" ||
      error.code === "PRODUCT_NOT_FOUND" ||
      error.code === "UNSUPPORTED_WEBSITE"
    ) {
      return res.status(422).json({
        success: false,
        message:
          "We couldn't retrieve this product. Please upload a garment image manually.",
        manualUploadAvailable: true,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this URL already exists.",
      });
    }

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while extracting the product. Please try again.",
    });
  }
};