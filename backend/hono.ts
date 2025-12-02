import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initDatabase } from "./database";

const app = new Hono();

let dbInitialized = false;
let dbError: Error | null = null;

initDatabase()
  .then(() => {
    dbInitialized = true;
  })
  .catch((error) => {
    dbError = error;
    console.error('[Backend] Failed to initialize database:', error);
  });

app.use("*", cors());





app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error.message);
    },
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: dbInitialized ? "ok" : "error", 
    message: dbInitialized ? "API is running" : "Database initialization failed",
    dbInitialized,
    error: dbError ? dbError.message : null
  });
});

app.get("/health", (c) => {
  const hasUrl = !!(process.env.TURSO_DATABASE_URL || process.env.TURSO_DB_URL || process.env.EXPO_PUBLIC_TURSO_DB_URL);
  const hasToken = !!(process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN);
  
  return c.json({
    backend: "running",
    database: {
      initialized: dbInitialized,
      hasUrl,
      hasToken,
      error: dbError ? dbError.message : null,
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDotenv: typeof process.env.TURSO_DATABASE_URL !== 'undefined' || typeof process.env.TURSO_DB_URL !== 'undefined',
    }
  });
});

app.notFound((c) => {
  console.error('[Backend] 404 Not Found:', c.req.url);
  return c.json({ error: 'Not Found', path: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[Backend] Error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
