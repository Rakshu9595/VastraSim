import express from "express";
import mongoose from "mongoose";
import axios from "axios";

const router = express.Router();

// GET /health
// Check backend and connected services
router.get("/", async (req, res) => {
  try {
    // Check MongoDB connection
    const databaseStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Check AI service availability
    let aiServiceStatus = "unavailable";

    try {
      const aiResponse = await axios.get(
        `${process.env.AI_SERVICE_URL}/health`,
        {
          timeout: 3000,
        }
      );

      if (aiResponse.status === 200) {
        aiServiceStatus = "connected";
      }
    } catch (error) {
      aiServiceStatus = "unavailable";
    }

    // Overall health status
    const isDatabaseConnected = databaseStatus === "connected";
    const isAiServiceConnected = aiServiceStatus === "connected";

    const overallStatus =
      isDatabaseConnected && isAiServiceConnected
        ? "healthy"
        : "degraded";

    return res.status(overallStatus === "healthy" ? 200 : 503).json({
      success: overallStatus === "healthy",
      status: overallStatus,

      message:
        overallStatus === "healthy"
          ? "FitMirror AI backend is running successfully"
          : "One or more services are unavailable",

      services: {
        backend: "running",
        database: databaseStatus,
        aiService: aiServiceStatus,
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    return res.status(500).json({
      success: false,
      status: "unhealthy",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;