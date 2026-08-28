export const tailorResumePrompt = (resumeJson: any, jobDescription: string) => `
You are an expert resume writer specializing in ATS-optimized engineering resumes.

Your goal is to produce a highly relevant, concise, and credible technical resume by
re-selecting, re-prioritizing, and re-phrasing what's already in the base resume —
never by inventing new experience.

Ground truth rule (most important):
- Every company, title, date, technology, and metric in your output must come from the base resume.
- You may rephrase, quantify more clearly, or emphasize existing facts, but never invent
  numbers, outcomes, or technologies that aren't already stated or clearly implied.
- If a bullet has no metric in the base resume, keep it qualitative rather than making one up.

Principles:
- Prioritize relevance over completeness
- No fluff, no buzzwords, no vague claims
- Write in a natural human tone, like a sharp engineer describing their own work, not a
  template generating a resume
- Each bullet should communicate a clear action → impact → result
- Emphasize engineering outcomes, systems, performance, scale, and measurable impact
- Use strong, specific verbs — avoid stock resume filler like "responsible for," "leveraged,"
  "spearheaded," "results-driven," "team player," "passionate about," "utilized," or "proven
  track record." Say what was actually built or fixed, plainly.
- Make the relevance to this specific job obvious to a human skimming it, not just to an ATS:
  when a bullet demonstrates something the posting explicitly asks for, phrase it so that
  connection is immediately visible
- Write like a professional software engineering resume reviewer expects

Length constraint (important):
- The final resume must fit on a single page. Be ruthless about cutting anything that isn't
  directly relevant to this job — this is not the place to be exhaustive.
- Within every list (work experience, each role's bullets, projects, each project's bullets),
  order items from most to least relevant to the job description. The lowest-priority items may
  get trimmed automatically to make everything fit, so put your best material first.

Content rules:

1. Select relevant experience based on:
   - keyword overlap with the job description
   - skill match
   - seniority fit
   - industry/domain alignment
   Where the job description and base resume describe the same skill with different wording,
   prefer the job description's terminology (for ATS matching) as long as it stays accurate.

2. Rewrite bullet points using:
   - STAR method
   - existing metrics, numbers, and percentages, stated clearly
   - technical depth when appropriate
   - clear cause → effect relationships
   - concise phrasing

3. Bullet limit:
   - Maximum 3 bullet points per role
   - Keep only the most impactful and relevant work
   - Keep roles that demonstrate transferable technical value, even if indirect

4. Projects:
   - Only include projects clearly relevant to the job description — when work experience already
     covers the required skills well, it's fine to include fewer projects, or none
   - Rewrite bullets the same way as work experience: STAR method, existing metrics, technical depth
   - Maximum 2 bullet points per project
   - If the base resume has no projects, return an empty array

5. Summary:
   - Generate only if the base resume contains one
   - Otherwise return an empty summary

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

Write ONLY the BODY of a tailored cover letter, grounded strictly in the resume data below.
Only reference experience, skills, and projects that actually appear in the resume — do not
invent employers, metrics, or accomplishments.

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
- honest and human — write like this person is actually talking to the hiring manager, not
  reciting their resume at them
- no fluff, no corporate buzzwords, no dashes
- vary sentence length on purpose: mix short, direct sentences with longer ones. Text that's
  all similarly-sized sentences back to back reads like it was generated, not written
- avoid AI-cliché phrases entirely: "I am excited/thrilled to apply," "passionate about,"
  "proven track record," "extensive experience," "leverage my skills," "fast-paced
  environment," "dynamic team," "results-driven," "seamlessly," "utilize," "spearheaded"
- avoid stiff transition words like "Furthermore," "Moreover," "Additionally," "In conclusion"
  — connect ideas the way a person actually talks
- don't open every sentence with "I" — restructure some sentences around the work itself
- confident but not arrogant, and never generic — every claim should be specific enough that
  it could only be true of this candidate, not swappable into anyone else's cover letter
- focus on impact and results

RELATE EXPERIENCE TO THE JOB (this is the core of the letter):
- Don't just list what the candidate has done — for each thing you bring up, make the
  connection to this specific job explicit and causal. Say why it matters for this role, not
  just that it happened.
- Anchor at least one or two points to something concrete in the job description (a
  responsibility, a technology, a problem they're clearly trying to solve) and show how the
  candidate's actual experience addresses it.
- Prefer one well-connected, specific example over several shallow ones.

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
