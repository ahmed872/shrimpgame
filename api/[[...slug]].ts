import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, path, type }) {
    // Useful in Vercel logs when something fails during initialization.
    console.error("[tRPC] error", { path, type, code: error.code, message: error.message });
  },
});
