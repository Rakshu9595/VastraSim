import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure Cloudinary
 */
const configureStorage = () => {
  try {
    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;

    // Validate environment variables
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary credentials are missing in the .env file"
      );
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });

    console.log("=================================");
    console.log("Cloudinary Configured Successfully");
    console.log(`Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
    console.log("=================================");

    return cloudinary;

  } catch (error) {
    console.error(
      "Cloudinary Configuration Failed:",
      error.message
    );

    throw error;
  }
};

export { cloudinary, configureStorage };