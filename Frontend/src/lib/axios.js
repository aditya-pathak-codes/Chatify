import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    return "/api";
  }
  // In production, use environment variable or window location
  return import.meta.env.VITE_BACKEND_URL 
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : `${window.location.origin}/api`;
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});
