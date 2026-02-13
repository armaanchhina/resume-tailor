import { LatexResumeData, TailoredResume } from "@/models/resume";
import { Resume } from "@prisma/client";


export function mapTailoredToLatex(resume: any, tailored: any) {
  const technicalSkills = (tailored?.skills?.technical ?? []).map((s: any) => ({
    category: escapeLatex(s.category ?? ""),
    items: escapeLatex(
      Array.isArray(s.items) ? s.items.join(", ") : String(s.items ?? "")
    ),
  }));
  return {
    FULL_NAME: escapeLatex(resume.fullName),
    PHONE: resume.phone,

    EMAIL: escapeLatex(resume.email),

    LINKEDIN: escapeLatex(resume.linkedin),

    GITHUB: escapeLatex(resume.github),

    education: resume.educationJson.map((e) => ({
      school: escapeLatex(e.school),
      degree: escapeLatex(e.degree),
      location: escapeLatex(e.location),
      startDate: escapeLatex(formatMonthYear(e.startDate ?? "")),
      endDate: escapeLatex(formatMonthYear(e.endDate ?? "")),
    })),

    workExperience: tailored.workExperience.map((w) => ({
      company: escapeLatex(w.company),
      position: escapeLatex(w.position),
      location: escapeLatex(w.location),
      startDate: formatMonthYear(w.startDate),
      endDate: formatMonthYear(w.endDate),
      responsibilities: w.responsibilities.map((r: any) => ({
        item: escapeLatex(r),
      })),
    })),

    technicalSkills,
  };
}

function escapeLatex(str: string) {
  if (!str) return "";

  // Remove zero-width / word-joiner characters that break pdflatex
  const cleaned = str.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");

  return cleaned
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}


function formatMonthYear(str: string): string {
  if (!str) return ""

  const [year, month] = str.split("-")
  if (!year || !month) return str
  const date = new Date()
  date.setMonth(Number(month)-1)
  const shortMonth = date.toLocaleString('default', {month: 'short'})
  const longMonth = date.toLocaleString('default', {month: 'long'})
  const stringMonth = shortMonth !== longMonth ? `${shortMonth}.` : shortMonth
  return `${stringMonth} ${year}`
}
