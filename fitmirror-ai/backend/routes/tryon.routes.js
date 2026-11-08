import express from "express";

import {
  createTryOn,
  getTryOnById,
} from "../controllers/tryon.controller.js";

const router = express.Router();

// POST /api/tryon
// Create a new virtual try-on request
router.post("/", createTryOn);

// GET /api/tryon/:id
// Get the status and result of a try-on request
router.get("/:id", getTryOnById);

export default router;