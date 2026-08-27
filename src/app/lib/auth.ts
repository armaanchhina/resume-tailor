import { cookies } from "next/headers";
import prisma from "./db";

export async function getSession() {
  const store = await cookies();
  const sessionToken = store.get("session")?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionToken } });
  if (!session || session.expiresAt < new Date()) return null;

  return session;
}
