import express from 'express';
import { getAllContacts } from '../controllers/message.controller.js';
import { getMessageByUserId } from '../controllers/message.controller.js';
import { sendMessage } from '../controllers/message.controller.js';
import { protectRoute } from '../middlewares/auth.middlewares.js';


const router = express.Router();

// the middlewares execute in the order they are defined, so we need to protect the routes before defining them
// this is actually more efficient since unathenticated requests will be blocked before hitting the route handlers, reducing unnecessary processing and database queries for unauthenticated users

router.use(arcjetProtection ,protectRoute);

router.get("/contacts",getAllContacts);
router.get("/chats",  getChatPartners);
router.get(":id",  getMessageByUserId);
router.get("/send/:id", sendMessage);

export default router;
