import "module-alias/register";
import dotenv from "dotenv";
dotenv.config();

// Validate environment configuration FIRST
import { validateEnvOrExit } from "@services/envConfigService";
const validatedEnv = validateEnvOrExit();

// Initialize Sentry SECOND (if configured)
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "your-sentry-dsn") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
  });
  console.log("✅ Sentry error tracking initialized");
}

import { createServer } from "http";
import socketService from "./core/services/socket.service";
import supportTasksService from "./modules/support/services/support-tasks.service";
import app from "./app";

// Start server
const PORT = validatedEnv.PORT || 4000;

const httpServer = createServer(app);

// Initialize Socket.IO
socketService.init(httpServer);

// Initialize Support Background Tasks
supportTasksService.init();

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export { server };
