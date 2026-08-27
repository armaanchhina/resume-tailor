import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function toProjectsJson(raw: any) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p) => ({
      title: (p?.title ?? "").trim(),
      tech: (p?.tech ?? "").trim(),
      link: (p?.link ?? "").trim(),
      startDate: p?.startDate ?? "",
      endDate: p?.endDate ?? "",
      current: !!p?.current,
      bullets: Array.isArray(p?.bullets)
        ? p.bullets.map((b: string) => b.trim()).filter(Boolean)
        : [],
    }))
    .filter((p) => p.title && p.bullets.length > 0);
}

function toTechnicalSkillsJson(raw: any) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((s) => {
      const category = (s?.category ?? "").trim();
      const itemsArr = String(s?.items ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      return { category, items: itemsArr };
    })
    .filter((s) => s.category && s.items.length > 0);
}

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


      const technicalSkillsJson = toTechnicalSkillsJson(body?.skills?.technical);
      const projectsJson = toProjectsJson(body?.projects);

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
          technicalSkillsJson,
          workJson: body.workExperience,
          educationJson: body.education,
          projectsJson,
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
          technicalSkillsJson,
          workJson: body.workExperience,
          educationJson: body.education,
          projectsJson,
        }
      });

      return NextResponse.json({ ok: true, resume });
    } catch (err) {
      console.error("Error storing resume:", err);
      return NextResponse.json({ ok: false, error: "Failed to store resume." }, { status: 500 });
    }
  }

export async function GET() {
  try{
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

    const resume = await prisma.resume.findUnique({
      where: {userId}
    })

    if (!resume) {
      return NextResponse.json({
        ok: true,
        hasResume: false,
        resume: null
      })
    }

    return NextResponse.json({
      ok: true,
      hasResume: true,
      resume
    })
  } catch (err) {
    console.error("Resume GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", hasResume: false },
      { status: 500 }
    );
  }
}
