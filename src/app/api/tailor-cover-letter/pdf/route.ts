import { readFile, writeFile, unlink } from "fs/promises";
import Mustache from "mustache";
import { promisify } from "util";
import { exec } from "child_process";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { mapCoverLetterToLatex } from "@/app/lib/mapToLatex";

const execAsync = promisify(exec);


const COVER_LETTER_TEX = `
\\documentclass[letterpaper,11pt]{article}

\\usepackage[empty]{fullpage}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{setspace}
\\usepackage{mathptmx}



\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{10pt}
\\pagenumbering{gobble}

\\begin{document}

%-------------------------
% RIGHT-ALIGNED HEADER
%-------------------------
\\begin{flushright}
{\\fontsize{21}{24}\\selectfont \\textbf{ {{{FULL_NAME}}} }}\\\\

\\noindent
\\rule{\\textwidth}{0.8pt}\\vspace{-11pt}
\\rule{\\textwidth}{0.8pt}

\\vspace{-8pt}
{\\small {{{CONTACT_LINE}}}}\\\\[8pt]
{\\small {{{DATE}}}}\\\\[12pt]
\\end{flushright}

\\begin{onehalfspace}
Dear {{{RECIPIENT}}},

{{{BODY}}}

Sincerely,\\\\
{{{FULL_NAME}}}
\\end{onehalfspace}



\\end{document}
`;

async function renderPdf(view: any) {
  Mustache.escape = (text) => text;
  const filled = Mustache.render(COVER_LETTER_TEX, view);

  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const texPath = `/tmp/cover_letter_${id}.tex`;
  const pdfPath = `/tmp/cover_letter_${id}.pdf`;
  const logPath = `/tmp/cover_letter_${id}.log`;

  try {
    await writeFile(texPath, filled, "utf8");
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=/tmp "${texPath}"`);

    const log = await readFile(logPath, "utf8").catch(() => "");
    const pageMatch = log.match(/Output written on .*\((\d+) pages?,/);
    const pages = pageMatch ? Number(pageMatch[1]) : 1;

    const pdf = await readFile(pdfPath);
    return { pdf, pages };
  } finally {
    await Promise.all(
      [".tex", ".pdf", ".log", ".aux", ".out"]
        .map((ext) => `/tmp/cover_letter_${id}${ext}`)
        .map((p) => unlink(p).catch(() => {}))
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    const { coverLetter, company } = await req.json();

    if (typeof coverLetter !== "string" || !coverLetter.trim()) {
      return NextResponse.json(
        { error: "coverLetter is required" },
        { status: 400 }
      );
    }

    const view = mapCoverLetterToLatex({
      resume,
      coverLetter,
      company: typeof company === "string" ? company : undefined,
    })

    const { pdf, pages } = await renderPdf(view);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cover_letter.pdf"',
        "X-CoverLetter-Pages": String(pages),
      },
    });
  } catch (err) {
    console.error("Cover letter PDF generation error", err);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
