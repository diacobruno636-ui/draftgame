import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { prisma } from "./lib/prisma";

const app = new Hono();

app.use("*", cors());

app.onError((err, c) => {
  console.error("[Hono Error]", err);
  console.error("[Hono Error Stack]", err.stack);
  
  return c.json({ 
    error: err.message || "Internal Server Error",
    details: err.stack?.split('\n')[0] || 'No additional details'
  }, 500);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error("[tRPC Error] Path:", path, "Error:", error);
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error: any) {
    console.error("[Health Check] Database error:", error);
    return c.json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    }, 500);
  }
});

export default app;
