import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
      const store = await cookies()
      const sessionToken = store.get("session")?.value

      if (!sessionToken) {
        return NextResponse.json(
          {ok: false, error: "Not authenticated"},
          {status: 401}
        )
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionToken}
      })

      if ( !session ) {
        return NextResponse.json(
          { okay: false, error: "Invalid Session"},
          {status: 401}
        )
      }

      const userId = session.userId

      const body = await req.json();

      const resume = await prisma.resume.upsert({
        where: {userId},
        update: {
          fullName: body.personalInfo.fullName,
          email: body.personalInfo.email,
          phone: body.personalInfo.phone,
          linkedin: body.personalInfo.linkedin,
          github: body.personalInfo.github,
          portfolio: body.personalInfo.portfolio,
          summary: body.summary,
          skills: body.skills.technical,  // Array directly
          workJson: body.workExperience,
          educationJson: body.education,
        },
        create: {
          userId,
          fullName: body.personalInfo.fullName,
          email: body.personalInfo.email,
          phone: body.personalInfo.phone,
          linkedin: body.personalInfo.linkedin,
          github: body.personalInfo.github,
          portfolio: body.personalInfo.portfolio,
          summary: body.summary,
          skills: body.skills.technical,
          workJson: body.workExperience,
          educationJson: body.education,
        }
      });
  
      return NextResponse.json({ ok: true, resume });
    } catch (err) {
      console.error("Error storing resume:", err);
      return NextResponse.json({ ok: false, error: "Failed to store resume." }, { status: 500 });
    }
  }

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/resume",
    message: "Resume API route is working (dummy GET).",
  });
}
