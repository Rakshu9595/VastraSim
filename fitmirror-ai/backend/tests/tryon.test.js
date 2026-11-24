import app from "../app";
import request from "supertest";
import { extractProductDetails } from "../services/productService";

jest.mock("../services/productService", () => ({
  extractProductDetails: jest.fn(),
}));

describe("Product Extraction API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });   
  