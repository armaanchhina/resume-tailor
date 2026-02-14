import prisma from "@/app/lib/db";
import { tailoreCoverLetterPrompt } from "@/app/lib/prompt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function POST(req: Request) {
  const { jobDescription } = await req.json();
  const session = await cookies();
  const sessionToken = session.get("session")?.value;

  const userSession = await prisma.session.findUnique({
    where: { id: sessionToken },
    include: { user: true },
  });

  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await prisma.resume.findUnique({
    where: { userId: userSession.userId },
  });

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const prompt = tailoreCoverLetterPrompt(resume, jobDescription);
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
