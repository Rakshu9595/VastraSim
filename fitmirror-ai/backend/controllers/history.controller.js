import mongoose from "mongoose";
import TryOnSession from "../models/TryOnSession.js";
import { cloudinary } from "../config/storage.js";

/**
 * Get the verified identity of the current requester.
 */
const getSessionOwner = (req) => {
  if (req.user?.id) {
    return {
      userId: req.user.id,
    };
  }

  if (req.guestSessionId) {
    return {
      guestSessionId: req.guestSessionId,
    };
  }

  return null;
};

/**
 * Build a MongoDB query restricted to the session owner.
 */
const buildOwnerQuery = (req) => {
  const owner = getSessionOwner(req);

  if (!owner) {
    return null;
  }

  return owner;
};

/**
 * GET /api/history
 *
 * Retrieve the current user's virtual try-on history.
 */
export const getHistory = async (req, res) => {
  try {
    const ownerQuery = buildOwnerQuery(req);

    if (!ownerQuery) {
      return res.status(401).json({
        success: false,
        message: "Authentication or a valid guest session is required.",
      });
    }

    // Pagination
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    // Retrieve sessions belonging to the requester
    const sessions = await TryOnSession.find(ownerQuery)
      .populate("productId", "productName productUrl category imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count the requester's sessions
    const totalSessions =
      await TryOnSession.countDocuments(ownerQuery);

    return res.status(200).json({
      success: true,
      message: "Try-on history retrieved successfully.",
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSessions / limit),
          totalSessions,
          limit,
        },
      },
    });

  } catch (error) {
    console.error("Get History Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve try-on history.",
    });
  }
};

/**
 * GET /api/history/:id
 *
 * Retrieve one authorized try-on session.
 */
export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const ownerQuery = buildOwnerQuery(req);

    if (!ownerQuery) {
      return res.status(401).json({
        success: false,
        message: "Authentication or a valid guest session is required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID.",
      });
    }

    const session = await TryOnSession.findOne({
      _id: id,
      ...ownerQuery,
    })
      .populate("productId", "productName productUrl category imageUrl")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Try-on session not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Try-on session retrieved successfully.",
      data: session,
    });

  } catch (error) {
    console.error("Get History By ID Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve try-on session.",
    });
  }
};

/**
 * DELETE /api/history/:id
 *
 * Delete an authorized try-on session and its associated images.
 */
export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const ownerQuery = buildOwnerQuery(req);

    if (!ownerQuery) {
      return res.status(401).json({
        success: false,
        message: "Authentication or a valid guest session is required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID.",
      });
    }

    // Find only a session owned by the requester
    const session = await TryOnSession.findOne({
      _id: id,
      ...ownerQuery,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Try-on session not found.",
      });
    }

    // Prevent deletion while inference may still be writing results
    if (
      session.status === "pending" ||
      session.status === "processing"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This try-on session is still processing. Please try again later.",
      });
    }

    /*
     * Cloudinary references must contain public IDs,
     * not full image URLs.
     *
     * This assumes images are stored using
     * Cloudinary's authenticated delivery type.
     */

    const imageRefs = [
      session.personImageRef,
      session.resultImageRef,
    ].filter(Boolean);

    // Delete associated images from Cloudinary
    for (const publicId of new Set(imageRefs)) {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        type: "authenticated",
        invalidate: true,
      });

      if (
        result.result !== "ok" &&
        result.result !== "not found"
      ) {
        throw new Error(
          `Cloudinary deletion failed for ${publicId}`
        );
      }
    }

    // Delete session metadata after image cleanup succeeds
    await TryOnSession.deleteOne({
      _id: session._id,
      ...ownerQuery,
    });

    return res.status(200).json({
      success: true,
      message: "Try-on history deleted successfully.",
    });

  } catch (error) {
    console.error("Delete History Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete try-on history.",
    });
  }
};