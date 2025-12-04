import { NextResponse } from "next/server";
import OpenAI from "openai";
import { tailorResumePrompt } from "@/app/lib/prompt";
import prisma from "@/app/lib/db";
import { cookies } from "next/headers";

console.log("API KEY: ", process.env.OPENAI_KEY)
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });


export async function POST(req: Request) {
  const { jobDescription } = await req.json();
  const session = await cookies()
  const sessionToken = session.get("session")?.value

  const userSession = await prisma.session.findUnique({
    where: {id: sessionToken},
    include: { user: true}
  })

  if ( !userSession ){
    return NextResponse.json({error: "Unauthorized"}, {status: 401})
  }

  const resume = await prisma.resume.findUnique({
    where: {userId: userSession.userId}
  })

  if ( !resume ){
    return NextResponse.json({error: "Resume not found"}, { status: 404})
  }

  const prompt = tailorResumePrompt(resume, jobDescription)


  const completion = await client.responses.create({
    model: "gpt-5.1-chat-latest",
    input: prompt,
  });

  const raw = completion.output_text
  console.log("RESULT: ", raw)
  const clean = raw
  .replace(/```json/gi, "")
  .replace(/```/g, "")
  .trim()

  let tailored
  try {
    tailored = JSON.parse(clean)
  } catch (e) {
    console.error("JSON parse failed. Cleaned result:", clean)
    return NextResponse.json({
      error: "Invalid JSON from model",
      raw: clean
    }, { status: 500 })
  }

  return NextResponse.json({ tailored });
}

