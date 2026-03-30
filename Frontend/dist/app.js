const state = {
  authUser: null,
  authMode: "login",
  authDrafts: {
    login: { email: "", password: "" },
    signup: { fullName: "", email: "", password: "" },
  },
  activeTab: "chats",
  contacts: [],
  chats: [],
  selectedUser: null,
  messages: [],
  onlineUsers: [],
  draftMessage: "",
  messageImagePreview: "",
  isBooting: true,
  isSubmittingAuth: false,
  isSendingMessage: false,
};

const app = document.getElementById("app");
const toastContainer = document.getElementById("toast-container");
let socket = null;
let socketScriptPromise = null;
let contactsPoller = null;
let chatsPoller = null;
let messagesPoller = null;
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const deployTokenKey = "chatify.deploy.token";

const getStoredDeployToken = () => (isLocalHost ? "" : window.localStorage.getItem(deployTokenKey) || "");

const setStoredDeployToken = (token) => {
  if (isLocalHost) return;

  if (token) {
    window.localStorage.setItem(deployTokenKey, token);
    return;
  }

  window.localStorage.removeItem(deployTokenKey);
};

const getApiUrl = (path) => {
  if (isLocalHost) {
    return `/api${path}`;
  }

  return `/.netlify/functions/api?route=${encodeURIComponent(path)}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("toast-visible");
  });

  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 250);
  }, 2600);
};

const api = async (path, options = {}) => {
  const deployToken = getStoredDeployToken();
  const config = {
    credentials: "include",
    headers: {
      ...(!isLocalHost && deployToken ? { Authorization: `Bearer ${deployToken}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  let response;

  try {
    response = await fetch(getApiUrl(path), config);
  } catch {
    stopLiveUpdates();
    throw new Error("Connection to Chatify was lost. Refresh the page and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error("Chatify API route is misconfigured on this deployment.");
  }

  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (!isLocalHost && response.status === 401) {
      setStoredDeployToken("");
    }

    throw new Error(
      payload?.message ||
        payload?.error ||
        (typeof payload === "string" && payload.trim() ? payload.trim() : "") ||
        "Request failed"
    );
  }

  return payload;
};

const normalizeAuthResponse = (payload) => ({
  user: payload?.user?._id ? payload.user : payload,
  token: payload?.token || "",
});

const getVisibleUsers = () => (state.activeTab === "contacts" ? state.contacts : state.chats);

const isOnline = (userId) => state.onlineUsers.includes(userId);

const syncSelectedUser = () => {
  if (!state.selectedUser) return;

  const freshUser =
    [...state.contacts, ...state.chats].find((user) => user._id === state.selectedUser._id) ||
    state.selectedUser;

  state.selectedUser = freshUser;
};

const loadContacts = async () => {
  state.contacts = await api("/messages/contacts");
  syncSelectedUser();
};

const loadChats = async () => {
  state.chats = await api("/messages/chats");
  syncSelectedUser();
};

const loadMessages = async (userId) => {
  state.messages = await api(`/messages/${userId}`);
};

const disconnectSocket = () => {
  if (socket) {
    socket.off("getOnlineUsers");
    socket.off("newMessage");
    socket.disconnect();
    socket = null;
  }

  state.onlineUsers = [];
};

const clearPollers = () => {
  clearInterval(contactsPoller);
  clearInterval(chatsPoller);
  clearInterval(messagesPoller);
  contactsPoller = null;
  chatsPoller = null;
  messagesPoller = null;
};

const stopLiveUpdates = () => {
  disconnectSocket();
  clearPollers();
};

const startPolling = () => {
  clearPollers();

  contactsPoller = setInterval(async () => {
    if (!state.authUser) return;
    await loadContacts();
    render();
  }, 12000);

  chatsPoller = setInterval(async () => {
    if (!state.authUser) return;
    await loadChats();
    render();
  }, 4000);

  messagesPoller = setInterval(async () => {
    if (!state.authUser || !state.selectedUser) return;

    const previousLastMessageId = state.messages.at(-1)?._id;
    await loadMessages(state.selectedUser._id);
    await loadChats();

    if (state.messages.at(-1)?._id !== previousLastMessageId) {
      render();
    }
  }, 2500);
};

const ensureSocketClient = async () => {
  if (window.io) return true;
  if (socketScriptPromise) return socketScriptPromise;

  socketScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "/socket.io/socket.io.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.io));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return socketScriptPromise;
};

const connectSocket = () => {
  if (!state.authUser || socket) return;

  socket = io({
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("getOnlineUsers", (userIds) => {
    state.onlineUsers = userIds;
    render();
  });

  socket.on("newMessage", async (message) => {
    if (
      state.selectedUser &&
      (message.senderId === state.selectedUser._id || message.receiverId === state.selectedUser._id)
    ) {
      state.messages = [...state.messages, message];
    }

    await loadChats();
    render();
  });
};

const hydrateWorkspace = async () => {
  await Promise.all([loadContacts(), loadChats()]);

  if (state.selectedUser) {
    await loadMessages(state.selectedUser._id);
  }
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();
  if (state.isSubmittingAuth) return;

  const mode = state.authMode;
  const payload = state.authDrafts[mode];

  state.isSubmittingAuth = true;
  render();

  try {
    const authPayload = normalizeAuthResponse(
      await api(`/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    state.authUser = authPayload.user;
    setStoredDeployToken(authPayload.token);

    state.messages = [];
    state.selectedUser = null;
    state.activeTab = "chats";
    await hydrateWorkspace();
    await startLiveUpdates();
    render();
    showToast(mode === "login" ? "Logged in successfully" : "Account created successfully", "ok");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    state.isSubmittingAuth = false;
    render();
  }
};

const handleLogout = async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Even if logout request fails, we still reset local state.
  }

  stopLiveUpdates();
  setStoredDeployToken("");
  state.authUser = null;
  state.contacts = [];
  state.chats = [];
  state.messages = [];
  state.selectedUser = null;
  state.draftMessage = "";
  state.messageImagePreview = "";
  render();
  showToast("Logged out", "ok");
};

const handleProfileImageChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = async () => {
    try {
      state.authUser = await api("/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify({ profilePic: reader.result }),
      });

      await Promise.all([loadContacts(), loadChats()]);
      render();
      showToast("Profile photo updated", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  reader.readAsDataURL(file);
};

const startLiveUpdates = async () => {
  stopLiveUpdates();

  if (await ensureSocketClient()) {
    connectSocket();
    return;
  }

  startPolling();
};

const selectUser = async (userId) => {
  const user = [...state.contacts, ...state.chats].find((entry) => entry._id === userId);
  if (!user) return;

  state.selectedUser = user;
  await loadMessages(user._id);
  render();
};

const handleMessageImageChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file", "error");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    state.messageImagePreview = reader.result;
    render();
  };
  reader.readAsDataURL(file);
};

const handleMessageSubmit = async (event) => {
  event.preventDefault();
  if (!state.selectedUser || state.isSendingMessage) return;

  const text = state.draftMessage.trim();
  const image = state.messageImagePreview;
  if (!text && !image) return;

  state.isSendingMessage = true;
  render();

  try {
    const message = await api(`/messages/send/${state.selectedUser._id}`, {
      method: "POST",
      body: JSON.stringify({ text, image }),
    });

    state.messages = [...state.messages, message];
    state.draftMessage = "";
    state.messageImagePreview = "";
    await loadChats();
    render();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    state.isSendingMessage = false;
    render();
  }
};

const renderUserList = () => {
  const users = getVisibleUsers();

  if (!users.length) {
    return `
      <div class="empty-state compact">
        <h3>No ${state.activeTab === "contacts" ? "contacts" : "chats"} yet</h3>
        <p>${state.activeTab === "contacts" ? "Create another account in a second browser window to start chatting." : "Start a conversation from the contacts tab and it will appear here."}</p>
      </div>
    `;
  }

  return users
    .map(
      (user) => `
        <button class="user-row ${state.selectedUser?._id === user._id ? "user-row-active" : ""}" data-user-id="${user._id}">
          <img class="avatar" src="${escapeHtml(user.profilePic || "/avatar.png")}" alt="${escapeHtml(user.fullName)}" />
          <div class="user-copy">
            <strong>${escapeHtml(user.fullName)}</strong>
            <span>${isOnline(user._id) ? "Online now" : "Offline"}</span>
          </div>
          <span class="status-dot ${isOnline(user._id) ? "status-online" : "status-offline"}"></span>
        </button>
      `
    )
    .join("");
};

const renderMessages = () => {
  if (!state.selectedUser) {
    return `
      <section class="chat-placeholder">
        <img src="/login.png" alt="Chat illustration" class="placeholder-image" />
        <h2>Select a conversation</h2>
        <p>Open a chat from the left side, or create a second account in another window to test real-time messaging locally.</p>
      </section>
    `;
  }

  const messagesMarkup = state.messages.length
    ? state.messages
        .map((message) => {
          const mine = message.senderId === state.authUser._id;
          return `
            <article class="message-row ${mine ? "message-row-mine" : ""}">
              <div class="message-bubble ${mine ? "message-bubble-mine" : ""}">
                ${message.image ? `<img class="message-image" src="${escapeHtml(message.image)}" alt="Shared attachment" />` : ""}
                ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ""}
                <time>${formatTime(message.createdAt)}</time>
              </div>
            </article>
          `;
        })
        .join("")
    : `
      <div class="empty-state compact">
        <h3>No messages yet</h3>
        <p>Say hello to start this conversation.</p>
      </div>
    `;

  return `
    <section class="chat-panel">
      <header class="chat-header">
        <div class="chat-user">
          <img class="avatar avatar-large" src="${escapeHtml(state.selectedUser.profilePic || "/avatar.png")}" alt="${escapeHtml(state.selectedUser.fullName)}" />
          <div>
            <h2>${escapeHtml(state.selectedUser.fullName)}</h2>
            <p>${isOnline(state.selectedUser._id) ? "Online" : "Offline"}</p>
          </div>
        </div>
      </header>

      <div class="messages" id="messages-view">${messagesMarkup}</div>

      <form class="composer" id="message-form">
        <textarea id="message-input" placeholder="Type your message...">${escapeHtml(state.draftMessage)}</textarea>
        ${
          state.messageImagePreview
            ? `
              <div class="image-preview">
                <img src="${escapeHtml(state.messageImagePreview)}" alt="Selected preview" />
                <button type="button" class="secondary-btn" id="clear-image-btn">Remove image</button>
              </div>
            `
            : ""
        }
        <div class="composer-actions">
          <label class="secondary-btn file-btn">
            Attach image
            <input id="message-image-input" type="file" accept="image/*" hidden />
          </label>
          <button class="primary-btn" type="submit" ${state.isSendingMessage ? "disabled" : ""}>
            ${state.isSendingMessage ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>
    </section>
  `;
};

const renderAuth = () => `
  <section class="auth-shell">
    <div class="auth-card">
      <div class="brand">
        <span class="brand-mark">C</span>
        <div>
          <h1>Chatify Local</h1>
          <p>Simple real-time chat running fully on your computer.</p>
        </div>
      </div>

      <div class="tab-strip">
        <button class="tab-btn ${state.authMode === "login" ? "tab-btn-active" : ""}" data-auth-mode="login">Login</button>
        <button class="tab-btn ${state.authMode === "signup" ? "tab-btn-active" : ""}" data-auth-mode="signup">Sign up</button>
      </div>

      <form id="auth-form" class="auth-form">
        ${
          state.authMode === "signup"
            ? `
              <label>
                Full name
                <input name="fullName" type="text" value="${escapeHtml(state.authDrafts.signup.fullName)}" placeholder="John Doe" required />
              </label>
            `
            : ""
        }
        <label>
          Email
          <input name="email" type="email" value="${escapeHtml(state.authDrafts[state.authMode].email)}" placeholder="name@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" value="${escapeHtml(state.authDrafts[state.authMode].password)}" placeholder="At least 6 characters" required />
        </label>
        <button class="primary-btn full-width" type="submit" ${state.isSubmittingAuth ? "disabled" : ""}>
          ${state.isSubmittingAuth ? "Please wait..." : state.authMode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  </section>
`;

const renderChatApp = () => `
  <section class="shell">
    <aside class="sidebar">
      <div class="profile-card">
        <div class="profile-copy">
          <img class="avatar avatar-large" src="${escapeHtml(state.authUser.profilePic || "/avatar.png")}" alt="${escapeHtml(state.authUser.fullName)}" />
          <div>
            <h2>${escapeHtml(state.authUser.fullName)}</h2>
            <p>${escapeHtml(state.authUser.email)}</p>
          </div>
        </div>
        <div class="profile-actions">
          <label class="secondary-btn file-btn">
            Change photo
            <input id="profile-image-input" type="file" accept="image/*" hidden />
          </label>
          <button class="secondary-btn" id="logout-btn" type="button">Logout</button>
        </div>
      </div>

      <div class="tab-strip">
        <button class="tab-btn ${state.activeTab === "chats" ? "tab-btn-active" : ""}" data-tab="chats">Chats</button>
        <button class="tab-btn ${state.activeTab === "contacts" ? "tab-btn-active" : ""}" data-tab="contacts">Contacts</button>
      </div>

      <div class="user-list">
        ${renderUserList()}
      </div>
    </aside>

    <main class="chat-stage">
      ${renderMessages()}
    </main>
  </section>
`;

const render = () => {
  app.innerHTML = state.isBooting
    ? `<section class="auth-shell"><div class="auth-card"><div class="empty-state"><h3>Loading Chatify...</h3><p>Preparing your local workspace.</p></div></div></section>`
    : state.authUser
      ? renderChatApp()
      : renderAuth();

  bindEvents();

  const messagesView = document.getElementById("messages-view");
  if (messagesView) {
    messagesView.scrollTop = messagesView.scrollHeight;
  }
};

const bindEvents = () => {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      render();
    });
  });

  const authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      state.authDrafts[state.authMode][target.name] = target.value;
    });

    authForm.addEventListener("submit", handleAuthSubmit);
  }

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll("[data-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      void selectUser(button.dataset.userId);
    });
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    void handleLogout();
  });

  document.getElementById("profile-image-input")?.addEventListener("change", (event) => {
    void handleProfileImageChange(event);
  });

  const messageForm = document.getElementById("message-form");
  if (messageForm) {
    messageForm.addEventListener("submit", (event) => {
      void handleMessageSubmit(event);
    });
  }

  document.getElementById("message-input")?.addEventListener("input", (event) => {
    state.draftMessage = event.target.value;
  });

  document.getElementById("message-image-input")?.addEventListener("change", handleMessageImageChange);

  document.getElementById("clear-image-btn")?.addEventListener("click", () => {
    state.messageImagePreview = "";
    render();
  });
};

const boot = async () => {
  render();

  try {
    if (!isLocalHost && !getStoredDeployToken()) {
      state.authUser = null;
      stopLiveUpdates();
      return;
    }

    state.authUser = await api("/auth/check");
    await startLiveUpdates();
    await hydrateWorkspace();
  } catch {
    setStoredDeployToken("");
    state.authUser = null;
    stopLiveUpdates();
  } finally {
    state.isBooting = false;
    render();
  }
};

boot();
