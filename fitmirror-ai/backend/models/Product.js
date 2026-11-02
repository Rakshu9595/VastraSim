import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Original product URL entered by the user
    productUrl: {
      type: String,
      required: [true, "Product URL is required"],
      trim: true,
    },

    // Retailer's domain (e.g. amazon.in, myntra.com)
    sourceDomain: {
      type: String,
      required: [true, "Source domain is required"],
      trim: true,
      lowercase: true,
    },

    // Extracted product name
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 300,
    },

    // Product image URL from the retailer
    imageUrl: {
      type: String,
      required: [true, "Product image URL is required"],
      trim: true,
    },

    // Clothing category
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

    // Optional retailer or extraction information
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for faster product searches
productSchema.index({ sourceDomain: 1 });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });

// Prevent duplicate product records for the same URL
productSchema.index({ productUrl: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

export default Product;