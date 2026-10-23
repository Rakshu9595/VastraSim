import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Check whether MongoDB URI is configured
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in the .env file");
    }

    // Establish MongoDB connection
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    // Display successful connection information
    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log(`Database Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log("=================================");

  } catch (error) {
    // Display connection error
    console.error("MongoDB Connection Failed:", error.message);

    // Pass the error to the server startup handler
    throw error;
  }
};

export default connectDB;