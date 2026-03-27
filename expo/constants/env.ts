type EnvConfig = {
  prismaDatabaseUrl: string;
};

const prismaUrlCandidates = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL,
  process.env.PRISMA_DATABASE_URL,
].filter((value): value is string => Boolean(value));

if (prismaUrlCandidates.length === 0) {
  throw new Error(
    "Missing Prisma connection string. Please set PRISMA_DATABASE_URL (or DATABASE_URL / POSTGRES_URL) in your project environment variables.",
  );
}

const resolvedPrismaUrl = prismaUrlCandidates[0];

if (!process.env.PRISMA_DATABASE_URL) {
  process.env.PRISMA_DATABASE_URL = resolvedPrismaUrl;
}

if (!process.env.DATABASE_URL && resolvedPrismaUrl.startsWith("postgres://")) {
  process.env.DATABASE_URL = resolvedPrismaUrl;
}

export const env: EnvConfig = {
  prismaDatabaseUrl: resolvedPrismaUrl,
};
