import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

export const ENV = {
  PORT: process.env.PORT?.trim() || "3000",
  MONGO_URI: process.env.MONGO_URI?.trim(),
  JWT_SECRET: process.env.JWT_SECRET?.trim() || "chatify-local-secret",
  NODE_ENV: process.env.NODE_ENV?.trim() || "development",
  CLIENT_URL: process.env.CLIENT_URL?.trim() || "http://localhost:5173",
  RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
  EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME?.trim(),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY?.trim(),
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET?.trim(),
  ARCJET_KEY: process.env.ARCJET_KEY?.trim(),
  ARCJET_ENV: process.env.ARCJET_ENV?.trim(),
};
