import express from "express";

import {
  uploadPersonImage,
  uploadGarmentImage,
} from "../controllers/upload.controller.js";

import {
  uploadPerson,
  uploadGarment,
} from "../middleware/upload.middleware.js";


const router = express.Router();

// Upload person's photograph
router.post(
  "/person",
  // verifySession,
  ...uploadPerson,
  uploadPersonImage
);

// Upload garment image
router.post(
  "/garment",
  // verifySession,
  ...uploadGarment,
  uploadGarmentImage
);

export default router;