import { NextResponse } from "next/server";
import { tailorResumePrompt } from "@/app/lib/prompt";
import { getSession } from "@/app/lib/auth";
import { getOpenAIClient } from "@/app/lib/openai";
import { buildLLMResume } from "@/app/lib/buildLLMResume";
import prisma from "@/app/lib/db";

export async function POST(req: Request) {
  const { jobDescription } = await req.json();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await prisma.resume.findUnique({ where: { userId: session.userId } });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const prompt = tailorResumePrompt(buildLLMResume(resume), jobDescription);
  const client = getOpenAIClient();

  const completion = await client.responses.create({
    model: "gpt-5.1-chat-latest",
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
