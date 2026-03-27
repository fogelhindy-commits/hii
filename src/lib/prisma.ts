import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    return new PrismaClient({
      adapter: new PrismaLibSql({
      url: tursoUrl,
      authToken: authToken || undefined,
      }),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
