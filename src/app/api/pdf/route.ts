import { readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { exec } from "child_process";
import { promisify } from "util";
import { read } from "fs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/app/lib/db";
import { mapTailoredToLatex } from "@/app/lib/mapToLatex";

const execAsync = promisify(exec);



export async function POST(req: Request){
    try {
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

        const data = await req.json();
        // console.log("data", data.workExperience)
        const latexData = mapTailoredToLatex(resume, data)
        console.log("LATEX DATA", latexData)
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