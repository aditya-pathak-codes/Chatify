import {create} from 'zustand';

export const useAuthStore = create((set) => ({
      authUser: {name: "Aditya", _id: 123, age: 25},
    isLoading: false,
    isLoggedIn: false,
    isLoading: false,

    login: () => {
        console.log("We just logging in...");
        set({ isLoggedIn: true, isLoading: true});



        

    },
}))