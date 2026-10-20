import { NextResponse } from "next/server";
import { tailorResumePrompt } from "@/app/lib/prompt";
import { getSession } from "@/app/lib/auth";
import { getOpenAIClient } from "@/app/lib/openai";
import { buildLLMResume } from "@/app/lib/buildLLMResume";
import { getUserResume } from "@/app/lib/getUserResume";
import { checkRateLimit } from "@/app/lib/rateLimit";

const MAX_JOB_DESCRIPTION_LENGTH = 10_000;
const DAILY_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const { jobDescription, resumeId } = await req.json();

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
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

  const rateLimit = checkRateLimit(`tailor-resume:${session.userId}`, DAILY_LIMIT, DAY_MS);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "You've hit today's resume-tailoring limit. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const resume = await getUserResume(session.userId, resumeId);
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const prompt = tailorResumePrompt(buildLLMResume(resume), jobDescription, resume.additionalInfo ?? undefined);
  const client = getOpenAIClient();

  const completion = await client.responses.create({
    model: "gpt-5.5",
    max_output_tokens: 4000,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "tailored_resume",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            targetCompany: {
              type: ["string", "null"],
              description: "Company name extracted from the job description. Null if not found."
            },
            workExperience: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  company: { type: "string" },
                  position: { type: "string" },
                  location: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  current: { type: "boolean" },
                  responsibilities: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "company",
                  "position",
                  "location",
                  "startDate",
                  "endDate",
                  "current",
                  "responsibilities",
                ],
              },
            },

            education: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  school: { type: "string" },
                  degree: { type: "string" },
                  location: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                },
                required: [
                  "school",
                  "degree",
                  "location",
                  "startDate",
                  "endDate",
                ],
              },
            },

            projects: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  tech: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  current: { type: "boolean" },
                  bullets: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "title",
                  "tech",
                  "startDate",
                  "endDate",
                  "current",
                  "bullets",
                ],
              },
            },

            skills: {
              type: "object",
              additionalProperties: false,
              properties: {
                technical: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      category: { type: "string" },
                      items: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: ["category", "items"],
                  },
                },
              },
              required: ["technical"],
            },
          },
          required: ["summary", "targetCompany", "workExperience", "education", "projects", "skills"],
        },
      },
    },
  });

  let tailored;
  try {
    tailored = JSON.parse(completion.output_text);
  } catch (e) {
    console.error("JSON parse failed:", completion.output_text);
    return NextResponse.json(
      { error: "Invalid JSON from model", raw: completion.output_text },
      { status: 500 }
    );
  }

  return NextResponse.json({ tailored });
}
