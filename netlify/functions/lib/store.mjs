import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

const appStore = getStore("chatify-app");
const stateKey = "state";

const strongRead = { type: "json", consistency: "strong" };
const defaultState = { users: [], messages: [] };
const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeState = (state) => ({
  users: Array.isArray(state?.users) ? state.users : [],
  messages: Array.isArray(state?.messages) ? state.messages : [],
});

const readState = async () => {
  const state = await appStore.get(stateKey, strongRead);
  return clone(normalizeState(state || defaultState));
};

const writeState = async (state) => {
  await appStore.setJSON(stateKey, normalizeState(state));
};

export const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
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

export const createUser = async ({ fullName, email, password, profilePic = "" }) => {
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
};

export const updateUserById = async (userId, updates) => {
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
};

export const createMessage = async ({ senderId, receiverId, text = "", image = "" }) => {
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
};

export const listMessagesBetweenUsers = async (firstUserId, secondUserId) => {
  const state = await readState();

  return state.messages
    .filter(
      (message) =>
        (message.senderId === firstUserId && message.receiverId === secondUserId) ||
        (message.senderId === secondUserId && message.receiverId === firstUserId)
    )
    .sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
    );
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
