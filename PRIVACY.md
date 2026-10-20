# Privacy Policy (Beta Draft)

_Last updated: 2026-10-19. This is a draft for the private beta — have it reviewed before
treating it as a binding policy for a public launch._

ResumeTailor is an early beta product. This document describes what the app actually does with
your data today, so you can decide whether you're comfortable using it.

## What we collect

- **Account info**: your name, email address, and a hashed password (we never store your
  plaintext password).
- **Resume data**: whatever you enter in the resume form — contact info, work history,
  education, projects, skills, and any free-text notes you add. You can save multiple resumes.
- **Job descriptions**: the text you paste in to tailor a resume or cover letter. We do not
  store job descriptions after the request completes.
- **Generated output**: tailored resumes and cover letters are generated on demand and returned
  to you as a PDF; we do not currently persist generated output server-side.

## How your data is used

- Your resume data and the job description you paste are sent to OpenAI's API to generate the
  tailored resume/cover letter. See OpenAI's own API data usage policy for how they handle data
  sent through their API — as of this writing, OpenAI does not use API data to train their
  models by default.
- We do not sell your data, and we do not share it with anyone other than OpenAI (as part of
  generating your tailored documents) and the infrastructure providers hosting the app and
  database.

## Data retention and deletion

- Resumes persist until you delete them. You can delete an individual saved resume at any time
  from the resume editor.
- There is currently no self-service "delete my account" flow. If you want your account and
  all associated resumes permanently deleted, contact the maintainer directly.
- Session cookies expire after 7 days of inactivity (sign in again to refresh).

## Security

- Passwords are hashed with bcrypt; we never store or log plaintext passwords.
- Sessions use httpOnly cookies and are scoped to your account; resumes are only ever readable
  by the account that created them.
- This is a beta product run on modest infrastructure. We take reasonable security precautions
  (input validation, rate limiting, access control) but do not provide enterprise-grade
  guarantees (e.g. SOC 2, formal penetration testing) at this stage.

## What we do not claim

- We do not guarantee that a tailored resume will pass any particular ATS system, improve your
  odds of an interview, or lead to a job offer.
- AI-generated content can still be imperfect. Please review your tailored resume and cover
  letter before sending them to an employer.

## Questions or deletion requests

Contact the maintainer directly (see the app for contact details) with any privacy questions
or to request deletion of your account and data.
