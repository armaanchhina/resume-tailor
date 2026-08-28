import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOpenAIClient } from "@/app/lib/openai";
import { buildLLMResume } from "@/app/lib/buildLLMResume";
import { tailorCoverLetterPrompt } from "@/app/lib/prompt";
import { NextResponse } from "next/server";

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

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let resumeForPrompt = tailoredResume && typeof tailoredResume === "object" ? tailoredResume : null;

  if (!resumeForPrompt) {
    const dbResume = await prisma.resume.findUnique({
      where: { userId: session.userId },
    });

    if (!dbResume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    resumeForPrompt = buildLLMResume(dbResume);
  }

  const prompt = tailorCoverLetterPrompt(resumeForPrompt, jobDescription);
  const client = getOpenAIClient();

  const completion = await client.responses.create({
    model: "gpt-5.5",
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
