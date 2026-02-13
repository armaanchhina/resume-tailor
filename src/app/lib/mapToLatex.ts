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
      location: escapeLatex("Victoria, BC"),
      startDate: "Jan. 2021",
      endDate: "April. 2025",
    })),

    workExperience: tailored.workExperience.map((w) => ({
      company: escapeLatex(w.company),
      position: escapeLatex(w.position),
      location: escapeLatex(w.location),
      startDate: w.startDate,
      endDate: w.endDate,
      responsibilities: w.responsibilities.map((r: any) => ({
        item: escapeLatex(r),
      })),
    })),

    technicalSkills,
  };
}

function escapeLatex(str: string) {
  if (!str) return "";
  return str
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
