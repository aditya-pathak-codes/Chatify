import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createMessage,
  createUser,
  findUserByEmail,
  findUserById,
  listChatPartnersForUser,
  listMessagesBetweenUsers,
  listUsersExceptUser,
  sanitizeUser,
  updateUserById,
} from "./lib/store.mjs";

const JWT_SECRET = process.env.CHATIFY_JWT_SECRET || "chatify-netlify-dev-secret";

const json = (payload, init = {}) =>
  new Response(JSON.stringify(payload), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

const getToken = (context) => context.cookies.get("jwt")?.value;

const setAuthCookie = (request, context, value) => {
  context.cookies.set({
    name: "jwt",
    value,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    maxAge: 60 * 60 * 24 * 7,
  });
};

const clearAuthCookie = (context) => {
  context.cookies.delete({ name: "jwt", path: "/" });
};

const requireAuth = async (context) => {
  const token = getToken(context);
  if (!token) {
    return { error: json({ message: "Unauthorized - No token provided" }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return { error: json({ message: "User not found" }, { status: 404 }) };
    }

    return { user: sanitizeUser(user) };
  } catch {
    return { error: json({ message: "Unauthorized - Invalid token" }, { status: 401 }) };
  }
};

const route = (request) => new URL(request.url).pathname.replace(/^\/api/, "");

const parseJsonBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const handleSignup = async (request, context) => {
  const body = await parseJsonBody(request);
  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!fullName || !email || !password) {
    return json({ message: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return json({ message: "Password must be at least 6 characters" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ message: "Invalid email format" }, { status: 400 });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return json({ message: "Email already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const user = await createUser({ fullName, email, password: hashedPassword });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
  setAuthCookie(request, context, token);

  return json(sanitizeUser(user), { status: 201 });
};

const handleLogin = async (request, context) => {
  const body = await parseJsonBody(request);
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return json({ message: "Email and password are required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return json({ message: "Invalid credentials" }, { status: 400 });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return json({ message: "Invalid credentials" }, { status: 400 });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
  setAuthCookie(request, context, token);

  return json(sanitizeUser(user));
};

const handleUpdateProfile = async (request, context) => {
  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const body = await parseJsonBody(request);
  const profilePic = body.profilePic;
  if (!profilePic) {
    return json({ message: "Profile pic is required" }, { status: 400 });
  }

  const user = await updateUserById(auth.user._id, { profilePic });
  return json(sanitizeUser(user));
};

const handleGetMessages = async (context, otherUserId) => {
  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  return json(await listMessagesBetweenUsers(auth.user._id, otherUserId));
};

const handleSendMessage = async (request, context, receiverId) => {
  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const receiver = await findUserById(receiverId);
  if (!receiver) {
    return json({ message: "Receiver not found." }, { status: 404 });
  }

  if (receiverId === auth.user._id) {
    return json({ message: "Cannot send messages to yourself." }, { status: 400 });
  }

  const body = await parseJsonBody(request);
  const text = body.text?.trim() || "";
  const image = body.image || "";

  if (!text && !image) {
    return json({ message: "Text or image is required." }, { status: 400 });
  }

  const message = await createMessage({
    senderId: auth.user._id,
    receiverId,
    text,
    image,
  });

  return json(message, { status: 201 });
};

export default async (request, context) => {
  const pathname = route(request);

  if (request.method === "GET" && pathname === "/health") {
    return json({ ok: true, runtime: "netlify-functions" });
  }

  if (request.method === "POST" && pathname === "/auth/signup") {
    return handleSignup(request, context);
  }

  if (request.method === "POST" && pathname === "/auth/login") {
    return handleLogin(request, context);
  }

  if (request.method === "POST" && pathname === "/auth/logout") {
    clearAuthCookie(context);
    return json({ message: "Logged out successfully" });
  }

  if (request.method === "GET" && pathname === "/auth/check") {
    const auth = await requireAuth(context);
    return auth.error || json(auth.user);
  }

  if (request.method === "PUT" && pathname === "/auth/update-profile") {
    return handleUpdateProfile(request, context);
  }

  if (request.method === "GET" && pathname === "/messages/contacts") {
    const auth = await requireAuth(context);
    return auth.error || json(await listUsersExceptUser(auth.user._id));
  }

  if (request.method === "GET" && pathname === "/messages/chats") {
    const auth = await requireAuth(context);
    return auth.error || json(await listChatPartnersForUser(auth.user._id));
  }

  const messagesMatch = pathname.match(/^\/messages\/([^/]+)$/);
  if (request.method === "GET" && messagesMatch) {
    return handleGetMessages(context, messagesMatch[1]);
  }

  const sendMatch = pathname.match(/^\/messages\/send\/([^/]+)$/);
  if (request.method === "POST" && sendMatch) {
    return handleSendMessage(request, context, sendMatch[1]);
  }

  return json({ message: "Not found" }, { status: 404 });
};

export const config = {
  path: "/api/*",
};
