const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const serverCommand = "node Backend/src/server.js";
let child = null;
let stopping = false;

const startServer = () => {
  child = spawn(serverCommand, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (stopping) {
      process.exit(code ?? 0);
      return;
    }

    console.error(`Chatify server stopped with code ${code ?? 0}. Restarting in 1 second...`);
    setTimeout(startServer, 1000);
  });

  child.on("error", (error) => {
    console.error("Failed to start Chatify server:", error.message);
    process.exit(1);
  });
};

const shutdown = () => {
  stopping = true;
  if (child && !child.killed) {
    child.kill();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
