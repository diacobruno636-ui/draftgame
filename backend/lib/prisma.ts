import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

let PrismaClientConstructor: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaModule = require("@prisma/client");
  PrismaClientConstructor = prismaModule.PrismaClient;
} catch {
  console.error("Failed to load Prisma Client. Please run: npx prisma generate");
  PrismaClientConstructor = class MockPrismaClient {};
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientConstructor({
    log: ["error", "warn"],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
