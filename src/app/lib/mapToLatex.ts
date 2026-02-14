import { LatexResumeData, TailoredResume } from "@/models/resume";
import { Resume } from "@prisma/client";


export function mapTailoredToLatex(resume: any, tailored: any) {
  const technicalSkills = (tailored?.skills?.technical ?? []).map((s: any) => ({
    category: escapeLatex(s.category ?? ""),
    items: escapeLatex(
      Array.isArray(s.items) ? s.items.join(", ") : String(s.items ?? "")
    ),
  }));

  const educationSorted = sortMostRecentFirst(resume.educationJson ?? [])
  const workSorted = sortMostRecentFirst(tailored.workExperience ?? [])
  return {
    FULL_NAME: escapeLatex(resume.fullName),
    PHONE: resume.phone,

    EMAIL: escapeLatex(resume.email),

    LINKEDIN: escapeLatex(resume.linkedin),

    GITHUB: escapeLatex(resume.github),

    education: educationSorted.map((e: any) => ({
      school: escapeLatex(e.school),
      degree: escapeLatex(e.degree),
      location: escapeLatex(e.location),
      startDate: escapeLatex(formatMonthYear(e.startDate ?? "")),
      endDate: escapeLatex(formatMonthYear(e.endDate ?? "")),
    })),

    workExperience: workSorted.map((w: any) => ({
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

type CoverLetterViewParams = {
  resume: {
    fullName?: string | null
    phone?: string | null
    email?: string | null
    linkedin?: string | null
  }
  coverLetter: string
  location?: string
  recipient?: string
}

export function mapCoverLetterToLatex({
  resume,
  coverLetter,
  location = "Victoria, BC",
  recipient = "Hiring Team",
}: CoverLetterViewParams) {
  const emailRaw = (resume.email ?? "").trim()

  return {
    FULL_NAME: escapeLatex(resume.fullName ?? ""),
    LOCATION: escapeLatex(location),
    PHONE: escapeLatex(resume.phone ?? ""),
    EMAIL_RAW: emailRaw,                 // raw if ever needed
    EMAIL_TEXT: escapeLatex(emailRaw),   // escaped for LaTeX
    LINKEDIN: resume.linkedin?.trim() || "",
    DATE: escapeLatex(
      new Date().toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    ),
    RECIPIENT: escapeLatex(recipient),
    BODY: textToLatexParagraphs(coverLetter),
  }
}


export function textToLatexParagraphs(text: string) {
  // Split into paragraphs by blank lines
  const paras = text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Inside a paragraph, keep single line breaks as LaTeX line breaks
  return paras.map((p) => escapeLatex(p).replace(/\n/g, "\\\\\n")).join("\n\n");
}

function escapeLatex(input: string) {
  if (!input) return ""
  return input
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/%/g, "\\%")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\$/g, "\\$")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\~{}")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
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

type YM = string | null | undefined

function ymToNumber(ym: YM): number {
  // "2024-05" -> 202405
  if (!ym) return -Infinity
  const [y, m] = ym.split("-")
  const yy = Number(y)
  const mm = Number(m)
  if (!Number.isFinite(yy) || !Number.isFinite(mm)) return -Infinity
  return yy * 100 + mm
}

function sortMostRecentFirst<T extends { startDate?: YM; endDate?: YM; current?: boolean }>(
  arr: T[]
): T[] {
  return [...arr].sort((a, b) => {
    const aEnd = a.current ? Infinity : ymToNumber(a.endDate)
    const bEnd = b.current ? Infinity : ymToNumber(b.endDate)

    if (bEnd !== aEnd) return bEnd - aEnd

    return ymToNumber(b.startDate) - ymToNumber(a.startDate)
  })
}
