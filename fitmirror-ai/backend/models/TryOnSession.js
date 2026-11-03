import mongoose from "mongoose";

const tryOnSessionSchema = new mongoose.Schema(
  {
    // User ID (null for guest users)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Guest session identifier
    guestSessionId: {
      type: String,
      default: null,
      index: true,
    },

    // Reference to the selected clothing product
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    // Reference to the uploaded person's image in Cloudinary
    personImageRef: {
      type: String,
      required: [true, "Person image reference is required"],
    },

    // Reference to the generated try-on image in Cloudinary
    resultImageRef: {
      type: String,
      default: null,
    },

    // AI processing status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // Error information if try-on generation fails
    errorCode: {
      type: String,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },

    // Time when AI processing starts
    startedAt: {
      type: Date,
      default: null,
    },

    // Time when AI processing finishes
    completedAt: {
      type: Date,
      default: null,
    },

    // Optional processing duration in milliseconds
    processingTime: {
      type: Number,
      default: null,
      min: 0,
    },

    // Garment category selected by the user
    category: {
      type: String,
      enum: [
        "upper_body",
        "lower_body",
        "dress",
        "outerwear",
        "one_piece",
        "unknown",
      ],
      default: "unknown",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for faster history retrieval
tryOnSessionSchema.index({ userId: 1, createdAt: -1 });
tryOnSessionSchema.index({ guestSessionId: 1, createdAt: -1 });
tryOnSessionSchema.index({ status: 1, createdAt: -1 });
tryOnSessionSchema.index({ productId: 1 });

// Ensure a session belongs to either a registered user or a guest
tryOnSessionSchema.pre("validate", function (next) {
  if (!this.userId && !this.guestSessionId) {
    return next(
      new Error("A try-on session must belong to a user or guest session")
    );
  }

  if (this.userId && this.guestSessionId) {
    return next(
      new Error("A try-on session cannot belong to both a user and a guest")
    );
  }

  next();
});

const TryOnSession = mongoose.model(
  "TryOnSession",
  tryOnSessionSchema
);

export default TryOnSession;