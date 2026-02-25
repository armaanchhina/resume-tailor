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
   - Prefer relevance and impact over completeness.
   - Keep roles that demonstrate transferable technical value, even if indirect.


4. Summary:
   - Generate only if base resume contains one
   - Otherwise return empty summary

5. Formatting:
   - Insert manual line breaks when needed

6. Skills:
   - Include only relevant technical skills
   - Remove outdated or unrelated tools
   - Organize skills logically by category
   
Extract the target company name from the job description.
If the company name is not explicitly stated, return null.

Base Resume:
${JSON.stringify(resumeJson)}

Job Description:
${jobDescription}
`;


export const tailorCoverLetterPrompt = (resumeJson: any, jobDescription: string) => `
You are an expert career writer.

Write ONLY the BODY of a tailored cover letter.

HARD REQUIREMENT:
- Total length must be between 350 and 420 words (inclusive).

IMPORTANT:
- Do NOT write a greeting
- Do NOT write "Dear Hiring Team"
- Do NOT write hello
- Do NOT write a closing paragraph like "thank you for your time"
- Do NOT write "Sincerely" or any sign off
- Do NOT include the applicant name
- Do NOT format like a letter
- Plain text only

You are writing ONLY the main content that goes between greeting and closing.

WRITING STYLE RULES:
- honest and human
- no fluff
- no corporate buzzwords
- no dashes
- simple clear sentences
- confident but not arrogant
- engineering resume style writing
- focus on impact and results
- sound like a real motivated candidate
- natural storytelling when describing experience

STRUCTURE:
- 2 to 4 paragraphs total
- Opening: interest in the role + your value
- Middle: 1 to 2 paragraphs mapping resume experience to the job
- Ending: short forward-looking statement about what you will deliver

JOB DESCRIPTION:
${jobDescription}

RESUME DATA:
${JSON.stringify(resumeJson, null, 2)}

OUTPUT RULES:
- Output ONLY the paragraphs
- No greeting
- No signature
- No extra commentary
- Must be 350 to 420 words
`;


