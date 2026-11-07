import express from "express";

import {
  extractProduct,
} from "../controllers/product.controller.js";

import {
  validateProductUrl,
} from "../middleware/validate-url.middleware.js";

const router = express.Router();

// POST /api/products/extract
// Validate the product URL and extract product information
router.post("/extract", validateProductUrl, extractProduct);

export default router;