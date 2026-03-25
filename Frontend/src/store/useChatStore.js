import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    activeTab: 'chats', // 'chats' or 'contacts'
    selectedUser: null,
    messages: [],
    users: [],
    contacts: [],

    setActiveTab: (tab) => set({ activeTab: tab }),

    setSelectedUser: (user) => set({ selectedUser: user }),

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },

    setUsers: (users) => set({ users }),

    setContacts: (contacts) => set({ contacts }),

    clearSelectedUser: () => set({ selectedUser: null, messages: [] }),
}));
