import express from 'express';
import { signup, login, logout, updateProfile } from '../controllers/auth.controller.js';
import {protectRoute} from '../middlewares/auth.middlewares.js';
const router = express.Router();

router.post("/signup", signup);
router.post("/login", arcjetProtection, login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check",protectRoute, (req, res) => { 
    res.status(200).json({ message: "Authenticated", user: req.user });
})

export default router;