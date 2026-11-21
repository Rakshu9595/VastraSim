import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Middleware
import {
  apiLimiter
} from "./middleware/rate-limit.middleware.js";

import {
  notFound,
  errorHandler
} from "./middleware/error.middleware.js";

// Routes
import healthRoutes from "./routes/health.routes.js";
import productRoutes from "./routes/product.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import tryOnRoutes from "./routes/tryon.routes.js";
import historyRoutes from "./routes/history.routes.js";

// Load environment variables.
dotenv.config();

// Initialize Express.
const app = express();

/**
 * Trust proxy configuration.
 *
 * Enable only when your deployment is behind
 * a trusted reverse proxy.
 *
 * Configure the correct proxy hop count or
 * trusted proxy addresses in production.
 */
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

/**
 * Security middleware.
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

/**
 * CORS configuration.
 */
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://127.0.0.1:5500"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header,
      // such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Access denied by CORS policy.")
      );
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Guest-Session-ID"
    ],
    credentials: true
  })
);

/**
 * Request body parsing.
 */
app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

/**
 * API rate limiting.
 */
app.use("/api", apiLimiter);

/**
 * API routes.
 */

// Health check
app.use("/health", healthRoutes);

// Product extraction
app.use("/api/products", productRoutes);

// Image uploads
app.use("/api/upload", uploadRoutes);

// Virtual try-on
app.use("/api/tryon", tryOnRoutes);

// Try-on history
app.use("/api/history", historyRoutes);

/**
 * Root endpoint.
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to FitMirror AI API",
    version: "1.0.0",
    status: "running"
  });
});

/**
 * Handle unknown routes.
 *
 * This must come after all API routes.
 */
app.use(notFound);

/**
 * Global error handler.
 *
 * This must always be the last middleware.
 */
app.use(errorHandler);

export default app;