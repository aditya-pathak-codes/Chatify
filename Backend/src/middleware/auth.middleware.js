import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import { findUserById, sanitizeUser } from "../lib/localStore.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const user = await findUserById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};
