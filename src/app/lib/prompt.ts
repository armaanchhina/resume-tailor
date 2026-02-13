export const tailorResumePrompt = (resumeJson: any, jobDescription: string) => `
    You are an expert resume writer.  
    Given the user’s base resume and the job description, create a tailored resume optimized for ATS.

    Steps:
    1. Determine the most relevant work experiences based on:
    - keyword overlap
    - skill match
    - seniority fit
    - industry/domain alignment

    2. Rewrite bullet points using:
    - STAR method
    - strong action verbs
    - numbers, metrics, percentages
    - concise phrasing (no fluff)
    - proper formatting (first letter capitalized, clear grammar)

    3. Bullet Point Limit:
    - Each work experience may contain **no more than 3–4 bullet points**.
    - If the base resume has more than 4 points, choose the 3–4 **most relevant** to the job
        based on keyword match and impact.

    4. Summary Rules:
    - Only generate a summary if the base resume contains a summary section.
    - If the base resume does not have a summary, return an empty string for "summary".

    5. Formatting Rules:
    - Every line in the generated content must be no longer than 107 characters (including spaces).
    - Do not create single-word second lines. If a line wraps, ensure the second line contains at least
    45 characters (including spaces).
    - Insert manual line breaks as needed to keep lines within 107 characters.
    - Apply these rules to the summary (if present) and all responsibility bullet points.

    Return output as JSON only in this structure:

    {
    "summary": "",
    "workExperience": [
        {
        "company": "",
        "position": "",
        "location": "",
        "startDate": "",
        "endDate": "",
        "current": false,
        "responsibilities": []
        }
    ],
    "education": [],
    "skills": {
      "technical": [
        {
          "category": "",
          "items": []
        }
      ]
    }
    }

    Notes:
    - "skills.technical[].items" must be an array of strings, not a comma-separated string.
    - "responsibilities" must be an array of strings, each a bullet line (with manual line breaks if needed).


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
