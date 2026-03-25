
import {create} from 'zustand';
import {axiosInstance} from '../lib/axiosInstance.js';  
import SignUpPage from '../pages/SignUpPage.jsx';

export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,

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
    }

    signup: async(data) => {
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data, isSigningUp: false });
            toast.success("Signup successful! Welcome to Chatify.");

        }catch (error) {
            console.error("Error signing up:", error);
            set({ isSigningUp: false });
            toast.error("Signup failed. Please try again.");
        }
    }

}));

   




