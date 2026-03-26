import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const handler = createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, path, type }) {
    console.error("[tRPC] error", { path, type, code: error.code, message: error.message });
  },
});

export default async (req: any, res: any) => {
  return handler(req, res);
};
