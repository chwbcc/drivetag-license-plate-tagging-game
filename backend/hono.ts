import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initDatabase } from "./database";

const app = new Hono();

let dbInitialized = false;
let dbInitError: Error | null = null;

initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('[Hono] Database initialized successfully');
  })
  .catch((error) => {
    dbInitError = error;
    console.error('[Hono] Database initialization failed:', error);
  });

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, type, path }) => {
      console.error('[tRPC Error]', { type, path, error: error.message });
    },
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: dbInitialized ? "ok" : "initializing", 
    message: dbInitialized ? "API is running" : "Database is initializing",
    dbError: dbInitError ? dbInitError.message : null
  });
});

app.get("/health", (c) => {
  return c.json({ 
    status: dbInitialized ? "healthy" : "unhealthy",
    database: dbInitialized ? "connected" : "not connected",
    error: dbInitError ? dbInitError.message : null,
    env: {
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    }
  });
});

app.onError((error, c) => {
  console.error('[Hono Error]', error);
  return c.json({ 
    error: error.message,
    status: 'error'
  }, 500);
});

export default app;
