import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const MAX_SUMMARY_LENGTH = 2_000;
const MAX_ADDITIONAL_INFO_LENGTH = 5_000;
const MAX_NAME_LENGTH = 200;

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
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { ok: false, error: "Not authenticated" },
          { status: 401 }
        )
      }

      const userId = session.userId

      const body = await req.json();

      if (!body?.personalInfo?.fullName || typeof body.personalInfo.fullName !== "string") {
        return NextResponse.json({ ok: false, error: "Full name is required." }, { status: 400 });
      }
      if (!body?.personalInfo?.email || typeof body.personalInfo.email !== "string") {
        return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
      }
      if (typeof body?.summary === "string" && body.summary.length > MAX_SUMMARY_LENGTH) {
        return NextResponse.json(
          { ok: false, error: `Summary is too long (max ${MAX_SUMMARY_LENGTH} characters).` },
          { status: 400 }
        );
      }
      if (typeof body?.additionalInfo === "string" && body.additionalInfo.length > MAX_ADDITIONAL_INFO_LENGTH) {
        return NextResponse.json(
          { ok: false, error: `Additional info is too long (max ${MAX_ADDITIONAL_INFO_LENGTH} characters).` },
          { status: 400 }
        );
      }

      const technicalSkillsJson = toTechnicalSkillsJson(body?.skills?.technical);
      const projectsJson = toProjectsJson(body?.projects);
      const name = (body?.resumeName || "").trim().slice(0, MAX_NAME_LENGTH) || "My Resume";

      const data = {
        name,
        fullName: body.personalInfo.fullName,
        email: body.personalInfo.email,
        phone: body.personalInfo.phone,
        linkedin: body.personalInfo.linkedin,
        github: body.personalInfo.github,
        portfolio: body.personalInfo.portfolio,
        summary: body.summary,
        additionalInfo: body.additionalInfo,
        technicalSkillsJson,
        workJson: body.workExperience,
        educationJson: body.education,
        projectsJson,
      };

      let resume;
      if (body.id) {
        const updated = await prisma.resume.updateMany({
          where: { id: body.id, userId },
          data,
        });
        if (updated.count === 0) {
          return NextResponse.json({ ok: false, error: "Resume not found" }, { status: 404 });
        }
        resume = await prisma.resume.findUnique({ where: { id: body.id } });
      } else {
        resume = await prisma.resume.create({ data: { userId, ...data } });
      }

      return NextResponse.json({ ok: true, resume });
    } catch (err) {
      console.error("Error storing resume:", err);
      return NextResponse.json({ ok: false, error: "Failed to store resume." }, { status: 500 });
    }
  }

export async function GET() {
  try{
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      ok: true,
      hasResume: resumes.length > 0,
      resumes,
    })
  } catch (err) {
    console.error("Resume GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", hasResume: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    const deleted = await prisma.resume.deleteMany({
      where: { id, userId: session.userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ ok: false, error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resume DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
