import { getStoreStats, initLocalStore } from "./localStore.js";

export const connectDB = async () => {
  try {
    const dataFilePath = await initLocalStore();
    const stats = await getStoreStats();
    console.log("Local data store ready:", dataFilePath);
    console.log(`Loaded ${stats.users} users and ${stats.messages} messages`);
  } catch (error) {
    console.error("Failed to initialize local data store:", error.message);
    process.exit(1);
  }
};
