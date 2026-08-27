// Reshapes a raw Resume DB record into the plain, predictable structure we
// send to the model — stripping DB noise (ids, timestamps) and normalizing
// field names that vary between older and newer records (role vs position, etc).
export function buildLLMResume(resume: any) {
  return {
    name: resume.fullName,
    contact: {
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      portfolio: resume.portfolio,
    },

    workExperience:
      resume.workJson?.map((job: any) => ({
        company: job.company,
        role: job.role ?? job.position,
        location: job.location,
        start: job.startDate,
        end: job.endDate,
        highlights: job.responsibilities ?? job.bullets ?? [],
        tech: job.techStack ?? job.technologies ?? [],
      })) ?? [],

    education: resume.educationJson ?? [],

    projects:
      resume.projectsJson?.map((project: any) => ({
        title: project.title,
        tech: project.tech,
        link: project.link,
        start: project.startDate,
        end: project.endDate,
        current: project.current,
        highlights: project.bullets ?? [],
      })) ?? [],

    skills: resume.technicalSkillsJson ?? [],
  };
}
