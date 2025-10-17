import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    console.log("Received resume data:", body);

    return NextResponse.json({
      ok: true,
      message: "Resume data received successfully",
      receivedFields: Object.keys(body),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error handling resume POST:", err);
    return NextResponse.json(
      { ok: false, error: "Server error occurred while processing resume." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/resume",
    message: "Resume API route is working (dummy GET).",
  });
}
