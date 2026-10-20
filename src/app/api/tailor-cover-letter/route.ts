import { getSession } from "@/app/lib/auth";
import { getUserResume } from "@/app/lib/getUserResume";
import { getOpenAIClient } from "@/app/lib/openai";
import { buildLLMResume } from "@/app/lib/buildLLMResume";
import { tailorCoverLetterPrompt } from "@/app/lib/prompt";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { NextResponse } from "next/server";

const MAX_JOB_DESCRIPTION_LENGTH = 10_000;
const DAILY_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jobDescription = body?.jobDescription;
  const tailoredResume = body?.tailoredResume;
  const resumeId = body?.resumeId;

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return NextResponse.json(
      { error: "jobDescription is required" },
      { status: 400 }
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `jobDescription is too long (max ${MAX_JOB_DESCRIPTION_LENGTH} characters)` },
      { status: 400 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`tailor-cover-letter:${session.userId}`, DAILY_LIMIT, DAY_MS);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "You've hit today's cover-letter limit. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const dbResume = await getUserResume(session.userId, resumeId);

  if (!dbResume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const resumeForPrompt =
    tailoredResume && typeof tailoredResume === "object" ? tailoredResume : buildLLMResume(dbResume);

  const prompt = tailorCoverLetterPrompt(resumeForPrompt, jobDescription, dbResume.additionalInfo ?? undefined);
  const client = getOpenAIClient();

  const completion = await client.responses.create({
    model: "gpt-5.5",
    max_output_tokens: 1200,
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
