import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", { err }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  await mongoose.connect(env.DATABASE_URL);
  logger.info("MongoDB connected");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
