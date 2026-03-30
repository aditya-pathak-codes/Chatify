import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

const usersStore = getStore("chatify-users");
const messagesStore = getStore("chatify-messages");

const strongRead = { type: "json", consistency: "strong" };

const readAll = async (store) => {
  const { blobs } = await store.list();
  const values = await Promise.all(blobs.map(({ key }) => store.get(key, strongRead)));
  return values.filter(Boolean);
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
};

export const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const users = await readAll(usersStore);

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

export const findUserById = async (userId) => usersStore.get(userId, strongRead);

export const listUsersExceptUser = async (userId) => {
  const users = await readAll(usersStore);

  return users
    .filter((user) => user._id !== userId)
    .map((user) => sanitizeUser(user))
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
};

export const createUser = async ({ fullName, email, password, profilePic = "" }) => {
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

  await usersStore.setJSON(user._id, user);
  return user;
};

export const updateUserById = async (userId, updates) => {
  const currentUser = await findUserById(userId);
  if (!currentUser) return null;

  const nextUser = {
    ...currentUser,
    ...updates,
    email: updates.email ? normalizeEmail(updates.email) : currentUser.email,
    updatedAt: new Date().toISOString(),
  };

  await usersStore.setJSON(userId, nextUser);
  return nextUser;
};

export const createMessage = async ({ senderId, receiverId, text = "", image = "" }) => {
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

  await messagesStore.setJSON(message._id, message);
  return message;
};

export const listMessagesBetweenUsers = async (firstUserId, secondUserId) => {
  const messages = await readAll(messagesStore);

  return messages
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
  const [users, messages] = await Promise.all([readAll(usersStore), readAll(messagesStore)]);
  const lastMessageByPartnerId = new Map();

  for (const message of messages) {
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
      user: users.find((user) => user._id === partnerId),
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
