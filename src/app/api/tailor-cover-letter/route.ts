import prisma from "@/app/lib/db";
import { tailoreCoverLetterPrompt } from "@/app/lib/prompt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jobDescription = body?.jobDescription;
  const tailoredResume = body?.tailoredResume;

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return NextResponse.json(
      { error: "jobDescription is required" },
      { status: 400 }
    );
  }

  const session = await cookies();
  const sessionToken = session.get("session")?.value;

  const userSession = await prisma.session.findUnique({
    where: { id: sessionToken },
  });

  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let resumeForPrompt;

  if (tailoredResume && typeof tailoredResume === "object") {
    resumeForPrompt = tailoredResume;
  }
  else {
    const dbResume = await prisma.resume.findUnique({
      where: { userId: userSession.userId },
    });

    if (!dbResume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    resumeForPrompt = dbResume;
  }

  const prompt = tailoreCoverLetterPrompt(resumeForPrompt, jobDescription);
  const completion = await client.responses.create({
    model: "gpt-5.1-chat-latest",
    input: prompt,
  });

  const coverLetter = completion.output_text?.trim() || "";
  if (!coverLetter) {
    return NextResponse.json(
      { error: "Empty response from model" },
      { status: 500 }
    );
  }
  return NextResponse.json({ coverLetter });
}
