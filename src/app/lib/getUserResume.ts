import prisma from "./db";

// Resolves which of a user's resumes a request is about. Falls back to the
// most recently updated one when no resumeId is given (e.g. older clients,
// or a user with a single resume).
export function getUserResume(userId: string, resumeId?: string | null) {
  return prisma.resume.findFirst({
    where: resumeId ? { id: resumeId, userId } : { userId },
    orderBy: { updatedAt: "desc" },
  });
}
