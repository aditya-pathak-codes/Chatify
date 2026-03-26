
import {create} from 'zustand';
import {axiosInstance} from '../lib/axios.js';
import toast from 'react-hot-toast';
import {io} from "socket.io-client";

const BASE_URL = import.meta.env.MODE === 'development' ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,
    isLoggingIn: false,
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });

        }catch (error) {
            console.error("Error checking auth:", error);
            set({ authUser: null, isCheckingAuth: false });

        }
        finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data, isSigningUp: false });
            toast.success("Signup successful! Welcome to Chatify.");

        } catch (error) {
            console.error("Error signing up:", error);
            set({ isSigningUp: false });
            toast.error(error.response?.data?.message || "Signup failed. Please try again.");
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
            get().connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed. Please try again.");
            console.error("Error logging in:", error);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error logging out");
            console.error("Logout error:", error);
        }
    },

    updateProfile: async (data) => {
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.message || "Error updating profile");
        }
    },

    connectSocket: () => {
         const {authUser} = get()
         if(!authUser || get().socket.connected) return 

         const socket = io
    },

    disconnectSocket: () => {
        // To be implemented with Socket.IO
    },
}));

   




