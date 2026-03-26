import { Resend } from "resend";
import { ENV } from "./env.js";

export const resendClient = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

export const sender = {
  email: ENV.EMAIL_FROM || "noreply@chatify.local",
  name: ENV.EMAIL_FROM_NAME || "Chatify",
};
