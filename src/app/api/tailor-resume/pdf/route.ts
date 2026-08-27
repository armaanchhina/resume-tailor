import { readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { mapTailoredToLatex } from "@/app/lib/mapToLatex";

const execAsync = promisify(exec);

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

        const data = await req.json();
        const latexData = mapTailoredToLatex(resume, data)
        const template = await readFile(process.cwd() + "/src/app/lib/resume.tex", "utf8");
        Mustache.escape = (text) => text;
        const filled = Mustache.render(template, latexData)

        const texPath = `/tmp/resume_${Date.now()}.tex`
        const pdfPath = texPath.replace(".tex", ".pdf")

        await writeFile(texPath, filled)

        await execAsync(`pdflatex -interaction=nonstopmode -output-directory=/tmp ${texPath}`)

        const pdf = await readFile(pdfPath)

        return new NextResponse(pdf, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="resume.pdf"'
            }
          });


    } catch (err) {
        console.error("PDF generation error", err)
        return NextResponse.json({error: "PDF generation failed"}, {status: 500})
    }
}
