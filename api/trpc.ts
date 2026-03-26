import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Vercel may invoke this function at /api/trpc, but req.url may vary.
// Mount at both paths to be safe.
app.use("/api/trpc", trpcMiddleware);
app.use(trpcMiddleware);

export default app;
