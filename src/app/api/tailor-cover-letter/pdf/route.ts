import { readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { promisify } from "util";
import { exec } from "child_process";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/app/lib/db";
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
{\\small {{{LOCATION}}} - {{{PHONE}}} - {{{EMAIL_TEXT}}}}\\\\[8pt]
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

export async function POST(req: Request) {
  try {
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
    const { coverLetter } = await req.json();

    if (typeof coverLetter !== "string" || !coverLetter.trim()) {
      return NextResponse.json(
        { error: "coverLetter is required" },
        { status: 400 }
      );
    }

    const view = mapCoverLetterToLatex({
      resume,
      coverLetter,
    })
    
    Mustache.escape = (text) => text;
    const filled = Mustache.render(COVER_LETTER_TEX, view);

    const texPath = `/tmp/cover_letter_${Date.now()}.tex`;
    const pdfPath = texPath.replace(".tex", ".pdf");

    await writeFile(texPath, filled, "utf8");
    await execAsync(
      `pdflatex -interaction=nonstopmode -output-directory=/tmp "${texPath}"`
    );

    const pdf = await readFile(pdfPath);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cover_letter.pdf"',
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
