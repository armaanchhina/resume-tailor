# ResumeTailor

AI-assisted resume and cover-letter tailoring. Fill out your resume once, paste a job
description, and get a one-page tailored resume (and matching cover letter) as a PDF.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19
- **Database**: PostgreSQL via Prisma
- **Auth**: custom email/password auth, bcrypt password hashing, cookie-based sessions
  (no third-party auth provider)
- **AI**: OpenAI API (`gpt-5.5`) for tailoring; structured JSON output for the resume,
  free-form text for the cover letter
- **PDF generation**: resume/cover-letter data is rendered into a LaTeX template
  (Mustache templating) and compiled with `pdflatex` (requires a full TeX Live install — this
  is why the app can't run on Vercel; see `DEPLOYMENT.md`)
- **Dev environment**: Docker Compose (app + Postgres + pgAdmin)

For production deployment (Render/Railway/Fly, GitHub, Cloudflare DNS), see `DEPLOYMENT.md`.

### How the resume data works

There is no file upload or resume parsing in this app. Users enter their resume through a
structured form (work experience, education, projects, skills, etc.), which is stored directly
as structured data. This is a deliberate choice for the current MVP, not a missing feature —
it avoids the complexity and risk of parsing arbitrary PDF/DOCX uploads. Users can save
multiple named resumes (e.g. "General SWE", "Bioinformatics SWE") and pick which one to tailor
each time.

## Local setup

### Prerequisites

- Node 20+
- Docker + Docker Compose
- An OpenAI API key

### 1. Environment variables

Copy `.env.example` and fill in real values:

```bash
cp .env.example .env          # used by `prisma` CLI commands run on the host
cp .env.example .env.docker   # used by the app container
```

In `.env`, point `DATABASE_URL` at `localhost` (for host-side Prisma commands):

```
DATABASE_URL="postgresql://docker:docker@localhost:5432/resume-tailor"
```

In `.env.docker`, point `DATABASE_URL` at the `postgres` service name (used inside the
container), and set `OPENAI_API_KEY`:

```
DATABASE_URL="postgresql://docker:docker@postgres:5432/resume-tailor"
OPENAI_API_KEY="sk-..."
```

### 2. Start everything

```bash
docker compose up -d --build
```

This builds the app image (includes a TeX Live install for PDF generation), starts Postgres,
runs pending Prisma migrations, and starts the Next.js dev server. The app is published on
whatever host port is set in `compose.yaml` under `app.ports` (currently `3001:3000`).

pgAdmin is available on `http://localhost:5050` (login: `docker@docker.com` / `docker`).

### 3. Working on the app

`./src` and `./prisma` are bind-mounted into the container, so edits on the host are picked up
by the running dev server. If you change `prisma/schema.prisma`, run a migration from the host:

```bash
npx prisma migrate dev --name <description>
```

The container's entrypoint re-runs `prisma generate` on every start, so the container's
Prisma client stays in sync automatically.

### Without Docker

You can also run directly on the host if you have a local Postgres and `pdflatex` (e.g. a
MacTeX/TeX Live install) available:

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint

## Known limitations (beta)

- No resume file upload/parsing — resume data is entered manually through the form.
- Rate limiting is in-memory and per-process; it resets on server restart and does not share
  state across multiple instances. Fine for a small beta on a single instance.
- No account deletion flow yet (individual resumes can be deleted; the account itself cannot
  be self-service deleted — contact the maintainer).
- No automated test suite yet; changes are verified manually end-to-end before release.
