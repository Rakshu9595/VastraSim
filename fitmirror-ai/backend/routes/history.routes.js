import express from "express";

import {
  getHistory,
  getHistoryById,
  deleteHistory,
} from "../controllers/history.controller.js";

const router = express.Router();

// GET /api/history
// Get all try-on history
router.get("/", getHistory);

// GET /api/history/:id
// Get a particular try-on session
router.get("/:id", getHistoryById);

// DELETE /api/history/:id
// Delete a try-on session
router.delete("/:id", deleteHistory);

export default router;