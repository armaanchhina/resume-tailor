export const tailorResumePrompt = (resumeJson: any, jobDescription: string) => `
You are an expert resume writer specializing in ATS-optimized engineering resumes.

Your goal is to produce a highly relevant, concise, and credible technical resume.

Principles:

- Prioritize relevance over completeness
- No fluff, no buzzwords, no vague claims
- Write in a natural human tone
- Each bullet should communicate a clear action → impact → result
- Tell a logical story of what was built, improved, or solved
- Emphasize engineering outcomes, systems, performance, scale, and measurable impact
- Use strong action verbs
- Prefer concrete evidence over adjectives
- Write like a professional software engineering resume reviewer expects

Content rules:

1. Select relevant experience based on:
   - keyword overlap
   - skill match
   - seniority fit
   - industry/domain alignment

2. Rewrite bullet points using:
   - STAR method
   - metrics, numbers, percentages when possible
   - technical depth when appropriate
   - clear cause → effect relationships
   - concise phrasing

3. Bullet limit:
   - Maximum 3–4 bullet points per role
   - Keep only the most impactful and relevant work

4. Summary:
   - Generate only if base resume contains one
   - Otherwise return empty summary

5. Formatting:
   - Each line must be ≤ 107 characters including spaces
   - Avoid single-word wrapped lines
   - Wrapped lines must contain ≥ 45 characters
   - Insert manual line breaks when needed

6. Skills:
   - Include only relevant technical skills
   - Remove outdated or unrelated tools
   - Organize skills logically by category

Base Resume:
${JSON.stringify(resumeJson, null, 2)}

Job Description:
${jobDescription}
`;


export const dummyData = {
  summary:
    "Software developer with experience building backend services in Python, TypeScript, and cloud-native systems. Strong focus on clean design, readable code, and product-focused engineering. Skilled in debugging, performance optimization, and collaborating across product and infrastructure teams.",
  workExperience: [
    {
      position: "Software Developer",
      company: "Shift",
      startDate: "May 2024",
      endDate: "Dec 2024",
      current: false,
      responsibilities: [
        "Built Python-based Django microservices supporting emissions tracking for 600,000+ active users.",
        "Migrated workloads to AWS Lambda and Fargate to reduce operational overhead and improve reliability.",
        "Designed and managed CI/CD pipelines that cut deployment times and reduced regressions.",
        "Collaborated with analytics and product teams to simplify data integrations.",
      ],
    },
    {
      position: "Full-Stack Developer",
      company: "Assembly",
      startDate: "Sep 2023",
      endDate: "Dec 2023",
      current: false,
      responsibilities: [
        "Developed React components to enhance dashboard performance and usability.",
        "Automated cross-platform revenue reporting using Python scripts and cloud functions.",
        "Improved API integrations and reduced dashboard load times across key views.",
      ],
    },
    {
      position: "Backend Developer",
      company: "Thrifty Foods",
      startDate: "Jan 2023",
      endDate: "Apr 2023",
      current: false,
      responsibilities: [
        "Built a Flask + Azure MySQL application for fleet maintenance tracking.",
        "Cut update time from 2–3 minutes to 30 seconds by migrating from manual spreadsheets.",
        "Integrated mileage data via the Samsara API to automate reporting.",
        "Helped facility managers monitor driver safety scores through a custom reporting system.",
      ],
    },
  ],
  skills: [
    "Python",
    "Django",
    "TypeScript",
    "React",
    "Next.js",
    "PostgreSQL",
    "AWS Lambda",
    "Docker",
    "CI/CD Pipelines",
    "APIs",
    "System Design",
    "Debugging",
  ],
};
