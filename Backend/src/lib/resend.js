import {Resend} from 'resend';
import {ENV} from "./env.js";

const resend = new Resend(ENV.RESEND_API_KEY);

export const sender = {
    name: ENV.EMAIL_FROM_NAME,
    email: ENV.EMAIL_FROM
};