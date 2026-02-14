import { NextResponse } from "next/server";
import OpenAI from "openai";
import { tailorResumePrompt } from "@/app/lib/prompt";
import prisma from "@/app/lib/db";
import { cookies } from "next/headers";

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

  console.log("Default Resume: ", resume)

  const prompt = tailorResumePrompt(resume, jobDescription);

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
          required: ["summary", "workExperience", "education", "skills"],
        },
      },
    },
  });

  const raw = completion.output_text;
  console.log("RESULT: ", raw)
  // const clean = raw
  // .replace(/```json/gi, "")
  // .replace(/```/g, "")
  // .trim()

  let tailored;
  try {
    // tailored = JSON.parse(clean)
    tailored = JSON.parse(completion.output_text);
  } catch (e) {
    console.error("JSON parse failed. Cleaned result:", raw);
    return NextResponse.json(
      {
        error: "Invalid JSON from model",
        raw: raw,
      },
      { status: 500 }
    );
  }

  console.log("tailored", tailored.workExperience);
  console.log(
    "skills categories:",
    tailored?.skills?.technical?.map((s: any) => s.category)
  );

  return NextResponse.json({ tailored });
}
