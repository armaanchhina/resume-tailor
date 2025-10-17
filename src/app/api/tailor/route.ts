import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/tailor",
    message: "Tailor API is alive.",
    version: "0.1.0",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { resume, jobDescription } = body || {};

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { ok: false, error: "Provide `resume` and `jobDescription` in JSON body." },
        { status: 400 }
      );
    }

    // Fake “tailored” result
    const fakeResult = {
      summary: "This is a dummy tailored summary for your resume.",
      bullets: [
        "Aligned experience with key job requirements (placeholder).",
        "Optimized keywords for ATS (placeholder).",
        "Quantified achievements where possible (placeholder).",
      ],
    };

    return NextResponse.json({
      ok: true,
      tailored: fakeResult,
      received: { resumeLength: String(resume).length, jdLength: String(jobDescription).length },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Tailor API error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
