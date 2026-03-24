
import {create} from 'zustand';
import {axiosInstance} from '../lib/axiosInstance.js';  

export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,

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
}));




