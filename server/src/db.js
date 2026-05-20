import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set. Running without persistence.");
    return;
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

