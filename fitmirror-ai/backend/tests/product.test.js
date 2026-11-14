import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";

import app from "../app.js";
import Product from "../models/Product.js";
import { extractProductDetails } from "../services/product.service.js";

// Mock the product extraction service.
jest.mock("../services/product.service.js", () => ({
  extractProductDetails: jest.fn()
}));

describe("Product API Tests", () => {
  const validProductUrl = "https://www.myntra.com/sample-product";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Successful product extraction
  test("should extract product details successfully", async () => {
    extractProductDetails.mockResolvedValue({
      product: {
        _id: "672abc123456789012345678",
        productUrl: validProductUrl,
        sourceDomain: "myntra.com",
        productName: "Casual Cotton Shirt",
        imageUrl: "https://example.com/shirt.jpg",
        category: "upper_body",
        brand: "Example Brand",
        price: 999,
        currency: "INR"
      },
      cached: false
    });

    const response = await request(app)
      .post("/api/products/extract")
      .send({ productUrl: validProductUrl });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(extractProductDetails).toHaveBeenCalled();
  });

  // Test 2: Missing product URL
  test("should reject request when product URL is missing", async () => {
    const response = await request(app)
      .post("/api/products/extract")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(extractProductDetails).not.toHaveBeenCalled();
  });

  // Test 3: Invalid product URL
  test("should reject an invalid product URL", async () => {
    const response = await request(app)
      .post("/api/products/extract")
      .send({
        productUrl: "not-a-valid-url"
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(extractProductDetails).not.toHaveBeenCalled();
  });

  // Test 4: Unsupported retailer
  test("should reject unsupported retailer URLs", async () => {
    const response = await request(app)
      .post("/api/products/extract")
      .send({
        productUrl: "https://example.org/product/shirt"
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(extractProductDetails).not.toHaveBeenCalled();
  });

  // Test 5: Product extraction service failure
  test("should handle product extraction errors", async () => {
    extractProductDetails.mockRejectedValue(
      new Error("Unable to extract product details")
    );

    const response = await request(app)
      .post("/api/products/extract")
      .send({
        productUrl: validProductUrl
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  // Test 6: Cached product
  test("should return an existing cached product", async () => {
    extractProductDetails.mockResolvedValue({
      product: {
        _id: "672abc123456789012345678",
        productUrl: validProductUrl,
        productName: "Casual Cotton Shirt",
        imageUrl: "https://example.com/shirt.jpg",
        category: "upper_body"
      },
      cached: true
    });

    const response = await request(app)
      .post("/api/products/extract")
      .send({
        productUrl: validProductUrl
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(extractProductDetails).toHaveBeenCalled();
  });
});