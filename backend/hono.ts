import { Hono } from "hono";
import { cors } from "hono/cors";
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

app.use("*", cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-user-data'],
  exposeHeaders: ['Content-Type'],
  maxAge: 86400,
}));

app.options('*', (c) => {
  return c.body(null, 204);
});

app.use('*', async (c, next) => {
  console.log(`[Backend] ${c.req.method} ${c.req.url}`);
  await next();
});



app.get("/", (c) => {
  console.log('[Backend] Root endpoint hit');
  return c.json({ 
    status: dbInitialized ? "ok" : "error", 
    message: dbInitialized ? "API is running" : "Database initialization failed",
    dbInitialized,
    error: dbError ? dbError.message : null,
    timestamp: new Date().toISOString(),
  });
});

app.get("/test", (c) => {
  console.log('[Backend] Test endpoint hit');
  return c.json({ 
    message: "Backend is reachable",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  const hasUrl = !!(process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL);
  const hasKey = !!(process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY);
  
  return c.json({
    backend: "running",
    database: {
      initialized: dbInitialized,
      hasUrl,
      hasKey,
      error: dbError ? dbError.message : null,
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDotenv: typeof process.env.SUPABASE_URL !== 'undefined',
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
