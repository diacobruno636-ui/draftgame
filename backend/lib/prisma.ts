import { withAccelerate } from "@prisma/extension-accelerate";
import { env } from "@/constants/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

let PrismaClientConstructor: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PrismaClientConstructor = require("@prisma/client").PrismaClient;
} catch (error) {
  console.error("[Prisma] Failed to load Prisma Client. Did you run `npx prisma generate`?", error);
  console.error("[Prisma] Please run the following commands:");
  console.error("[Prisma]   1. npx prisma generate");
  console.error("[Prisma]   2. npx prisma db push");
  throw new Error("Prisma Client not generated. Please run 'npx prisma generate' and 'npx prisma db push'");
}

function createPrismaClient() {
  const client = new PrismaClientConstructor({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: env.prismaDatabaseUrl,
      },
    },
  });

  if (env.prismaDatabaseUrl.startsWith("prisma+")) {
    return client.$extends(withAccelerate());
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
