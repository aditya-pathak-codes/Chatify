const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const children = [];

const startProcess = (name, command, cwd) => {
  const child = spawn(command, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }

    shutdown(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`Failed to start ${name}:`, error.message);
    shutdown(1);
  });

  children.push(child);
};

const shutdown = (code = 0) => {
  while (children.length) {
    const child = children.pop();
    if (child && !child.killed) {
      child.kill();
    }
  }

  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startProcess("backend", "npm run dev", path.join(rootDir, "Backend"));
startProcess("frontend", "npm run dev", path.join(rootDir, "Frontend"));
