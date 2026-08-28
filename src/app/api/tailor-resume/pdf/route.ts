import { readFile, writeFile, unlink } from "fs/promises";
import Mustache from "mustache";
import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { mapTailoredToLatex } from "@/app/lib/mapToLatex";
import { trimOneStep } from "@/app/lib/fitResumeToOnePage";

const execAsync = promisify(exec);
const MAX_TRIM_ATTEMPTS = 15;

async function renderPdf(latexData: any, template: string) {
  const filled = Mustache.render(template, latexData);

  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const texPath = `/tmp/resume_${id}.tex`;
  const pdfPath = `/tmp/resume_${id}.pdf`;
  const logPath = `/tmp/resume_${id}.log`;

  try {
    await writeFile(texPath, filled);
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=/tmp ${texPath}`);

    const log = await readFile(logPath, "utf8").catch(() => "");
    const pageMatch = log.match(/Output written on .*\((\d+) pages?,/);
    const pages = pageMatch ? Number(pageMatch[1]) : 1;

    const pdf = await readFile(pdfPath);
    return { pdf, pages };
  } finally {
    await Promise.all(
      [".tex", ".pdf", ".log", ".aux", ".out"]
        .map((ext) => `/tmp/resume_${id}${ext}`)
        .map((p) => unlink(p).catch(() => {}))
    );
  }
}

export async function POST(req: Request){
    try {
        const session = await getSession();
        if (!session) {
          return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const resume = await prisma.resume.findUnique({
          where: {userId: session.userId}
        })

        if ( !resume ){
          return NextResponse.json({error: "Resume not found"}, { status: 404})
        }

        const tailored = await req.json();
        const template = await readFile(process.cwd() + "/src/app/lib/resume.tex", "utf8");
        Mustache.escape = (text) => text;

        let { pdf, pages } = await renderPdf(mapTailoredToLatex(resume, tailored), template);

        let attempts = 0;
        while (pages > 1 && attempts < MAX_TRIM_ATTEMPTS && trimOneStep(tailored)) {
          ({ pdf, pages } = await renderPdf(mapTailoredToLatex(resume, tailored), template));
          attempts++;
        }

        return new NextResponse(pdf, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="resume.pdf"',
              "X-Resume-Pages": String(pages),
              "X-Resume-Trim-Attempts": String(attempts),
            }
          });


    } catch (err) {
        console.error("PDF generation error", err)
        return NextResponse.json({error: "PDF generation failed"}, {status: 500})
    }
}
