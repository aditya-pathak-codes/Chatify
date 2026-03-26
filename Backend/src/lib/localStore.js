import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory = path.resolve(__dirname, "../../data");
const dataFilePath = path.join(dataDirectory, "chatify.local.json");

const defaultState = {
  users: [],
  messages: [],
};

let writeQueue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeState = (state) => ({
  users: Array.isArray(state?.users) ? state.users : [],
  messages: Array.isArray(state?.messages) ? state.messages : [],
});

const ensureStoreFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(defaultState, null, 2), "utf8");
  }
};

const readState = async () => {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    if (!raw.trim()) return clone(defaultState);

    return normalizeState(JSON.parse(raw));
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(defaultState, null, 2), "utf8");
    return clone(defaultState);
  }
};

const writeState = async (state) => {
  await ensureStoreFile();
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeState(state), null, 2), "utf8");
};

const queueWrite = async (operation) => {
  const run = writeQueue.then(operation, operation);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};

const sortByCreatedAt = (items, direction = "asc") =>
  [...items].sort((first, second) => {
    const diff = new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
    return direction === "desc" ? -diff : diff;
  });

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
};

export const initLocalStore = async () => {
  await ensureStoreFile();
  return dataFilePath;
};

export const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const state = await readState();

  return state.users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

export const findUserById = async (userId) => {
  const state = await readState();
  return state.users.find((user) => user._id === userId) || null;
};

export const listUsersExceptUser = async (userId) => {
  const state = await readState();

  return state.users
    .filter((user) => user._id !== userId)
    .map((user) => sanitizeUser(user))
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
};

export const createUser = async ({ fullName, email, password, profilePic = "" }) =>
  queueWrite(async () => {
    const state = await readState();
    const now = new Date().toISOString();

    const user = {
      _id: randomUUID(),
      fullName,
      email: normalizeEmail(email),
      password,
      profilePic,
      createdAt: now,
      updatedAt: now,
    };

    state.users.push(user);
    await writeState(state);

    return user;
  });

export const updateUserById = async (userId, updates) =>
  queueWrite(async () => {
    const state = await readState();
    const userIndex = state.users.findIndex((user) => user._id === userId);
    if (userIndex === -1) return null;

    const currentUser = state.users[userIndex];
    const nextUser = {
      ...currentUser,
      ...updates,
      email: updates.email ? normalizeEmail(updates.email) : currentUser.email,
      updatedAt: new Date().toISOString(),
    };

    state.users[userIndex] = nextUser;
    await writeState(state);

    return nextUser;
  });

export const createMessage = async ({ senderId, receiverId, text = "", image = "" }) =>
  queueWrite(async () => {
    const state = await readState();
    const now = new Date().toISOString();

    const message = {
      _id: randomUUID(),
      senderId,
      receiverId,
      text,
      image,
      createdAt: now,
      updatedAt: now,
    };

    state.messages.push(message);
    await writeState(state);

    return message;
  });

export const listMessagesBetweenUsers = async (firstUserId, secondUserId) => {
  const state = await readState();

  const messages = state.messages.filter(
    (message) =>
      (message.senderId === firstUserId && message.receiverId === secondUserId) ||
      (message.senderId === secondUserId && message.receiverId === firstUserId)
  );

  return sortByCreatedAt(messages);
};

export const listChatPartnersForUser = async (userId) => {
  const state = await readState();
  const lastMessageByPartnerId = new Map();

  for (const message of state.messages) {
    if (message.senderId !== userId && message.receiverId !== userId) continue;

    const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
    const previousMessage = lastMessageByPartnerId.get(partnerId);

    if (
      !previousMessage ||
      new Date(message.createdAt).getTime() > new Date(previousMessage.createdAt).getTime()
    ) {
      lastMessageByPartnerId.set(partnerId, message);
    }
  }

  return [...lastMessageByPartnerId.entries()]
    .map(([partnerId, lastMessage]) => ({
      user: state.users.find((user) => user._id === partnerId),
      lastMessage,
    }))
    .filter((entry) => entry.user)
    .sort(
      (first, second) =>
        new Date(second.lastMessage.createdAt).getTime() -
        new Date(first.lastMessage.createdAt).getTime()
    )
    .map((entry) => sanitizeUser(entry.user));
};

export const getStoreStats = async () => {
  const state = await readState();

  return {
    users: state.users.length,
    messages: state.messages.length,
    dataFilePath,
  };
};
