import { ENV } from "./env.js";

const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === ENV.CLIENT_URL) return true;
  return localhostPattern.test(origin);
};
