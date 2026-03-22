import aj from '../lib/arcjet.js';
import { isSpoofedBot } from "@arcjet/inspect";

export const arjetProtection = async (req, res, next) => {
    try {
        const decision = await aj.protect(req);

        if (decision.isDenied) {
            if(decision.reason.isRateLimit) {
                return res.status(429).json({ message: "Rate limit exceeded. Please try again later." });
            }
        else if (decision.reason.isBot) {
            return res.status(403).json({ message: "Access denied. Bot detected" });
        }
        else {
            return res.status(403).json({ message: "Access denied by security policy" });
        }
        }

        //check for spoofed bots
        if (decision.results.some(isSpoofedBot)) {
            return res.status(403).json({error:"Spoofed bot detected", message: "Access denied. Spoofed bot detected" });
        }

    }catch (error) {
        console.error("Arcjet Protection Error:", error);
        next();
    }
}
