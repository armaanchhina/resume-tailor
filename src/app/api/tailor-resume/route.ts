import { NextResponse } from "next/server";
import OpenAI from "openai";
import { tailorResumePrompt } from "@/app/lib/prompt";
import prisma from "@/app/lib/db";
import { cookies } from "next/headers";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  const { jobDescription } = await req.json();
  const session = await cookies();
  const sessionToken = session.get("session")?.value;

  const userSession = await prisma.session.findUnique({
    where: { id: sessionToken },
    select: {
      id: true,
      expiresAt: true,
      userId: true,
      user: {
        select: {
          resumes: {
            take: 1, // your schema says Resume.userId is unique, so there will only be one anyway
            select: {
              id: true,
              userId: true,
              fullName: true,
              email: true,
              phone: true,
              linkedin: true,
              github: true,
              portfolio: true,
              summary: true,
              workJson: true,
              educationJson: true,
              projectsJson: true,
              technicalSkillsJson: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = userSession.user.resumes[0];

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const llmResume = buildLLMResume(resume);

  const prompt = tailorResumePrompt(llmResume, jobDescription);

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

  const raw = completion.output_text;
  console.log("RESULT: ", raw);
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

function buildLLMResume(resume: any) {
  return {
    name: resume.fullName,
    contact: {
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      portfolio: resume.portfolio,
    },

    workExperience:
      resume.workJson?.map((job: any) => ({
        company: job.company,
        role: job.role ?? job.position,
        location: job.location,
        start: job.startDate,
        end: job.endDate,
        highlights: job.responsibilities ?? job.bullets ?? [],
        tech: job.techStack ?? job.technologies ?? [],
      })) ?? [],

    education: resume.educationJson ?? [],

    projects:
      resume.projectsJson?.map((project: any) => ({
        title: project.title,
        tech: project.tech,
        link: project.link,
        start: project.startDate,
        end: project.endDate,
        current: project.current,
        highlights: project.bullets ?? [],
      })) ?? [],

    skills: resume.technicalSkillsJson ?? [],
  };
}
