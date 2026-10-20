# Deployment Guide

## 1. Can this run on Vercel? No.

The short answer: **this app cannot run on Vercel as currently built**, and the fix is not a
quick config change — it's a different hosting model. Here's why, concretely:

### The blocker: PDF generation needs a real LaTeX install

`src/app/api/tailor-resume/pdf/route.ts` and `src/app/api/tailor-cover-letter/pdf/route.ts`
shell out to the `pdflatex` binary (`child_process.exec`) to compile a `.tex` file into a PDF.
That binary comes from a full TeX Live install — the Dockerfile runs:

```
apt-get install -y texlive texlive-latex-extra texlive-fonts-recommended texlive-luatex ghostscript
```

This is a system-level package install producing several hundred MB of binaries and font data.
Vercel Functions run in a locked-down serverless sandbox: there's no `apt-get`, no ability to
install arbitrary system binaries, and deployment bundles have hard size limits that a LaTeX
toolchain blows past by a wide margin. There is no supported way to get `pdflatex` running
inside a Vercel Function. This isn't a workaround-able config issue — it's a fundamentally
different execution model than what this app's PDF generation needs.

Two secondary issues compound this, in case you're tempted to force it anyway:

- **The `.tex` template file itself might not even ship with the function.** `resume.tex` is
  read via `readFile(process.cwd() + "/src/app/lib/resume.tex")` — a dynamically-built path,
  which Vercel's static file-tracing (used to decide what to include in each function's
  deployment bundle) may not pick up, silently dropping the template from production.
- **Rate limiting is in-memory** (`src/app/lib/rateLimit.ts`). That's intentional for a small
  beta on one long-running process, but Vercel Functions are stateless and can scale to many
  concurrent instances with no shared memory — the "30 generations/day" cap would become
  meaningless (each instance has its own counter).

### What it would take to use Vercel anyway

Rewriting PDF generation to avoid LaTeX entirely (e.g. an HTML-to-PDF renderer like
Puppeteer/`@sparticuz/chromium`, or a JS-native PDF library like `@react-pdf/renderer`) and
moving rate limiting to a shared store (Vercel KV/Upstash Redis) would make Vercel viable. That
is a real rewrite of a working, already-tested feature, not a deployment config change — out of
scope for "prepare for deployment." If you want that path later, it's a separate, scoped task.

### Recommended alternative: a Docker-native host

This app already has a working Dockerfile — the simplest path is a host that runs that Docker
image directly, with a managed Postgres add-on. **Render** is the pick here: dashboard-based
GitHub deploys, native Dockerfile support, a managed Postgres add-on in the same dashboard,
free custom domains (works cleanly with Cloudflare DNS), and a free tier sufficient for a 10-20
user beta. Railway and Fly.io are comparable alternatives if you end up preferring their
pricing or workflow — the steps below are Render-specific, but the shape is the same anywhere
that runs your Dockerfile with a persistent container (not serverless).

---

## 2. What changed in this repo for deployment

- **`Dockerfile`** is now a multi-stage production image (see section 2a for why/how), builds
  with `next build`, and starts with `next start` (binds to `$PORT` automatically, which
  Render/Railway/Fly set at runtime).
- **`Dockerfile.dev`** is the original dev image (hot reload via `next dev`, used by
  `docker compose up` locally). `compose.yaml` now points at it explicitly.
- **`docker-entrypoint.prod.sh`** only starts the server — it deliberately does *not* run
  migrations. See section 2b for why.
- The base image moved from `node:20-bullseye` to `node:20-bookworm`. Debian 11 ("bullseye")'s
  security repo has aged out — a fresh build of the old image fails outright (`apt-get` 404s
  fetching `texlive-binaries` and friends). This was breaking **any** fresh build, dev or prod,
  not just a production concern — worth knowing about regardless of where you deploy.

Verify the production image builds on your machine before trusting any of this:

```bash
docker build -t resume-tailor-prod -f Dockerfile .
```

### 2a. Image size optimization

The first working production image came in at **6.5 GB**, almost entirely TeX Live. Three
changes brought it down without touching PDF generation itself, LaTeX, or output quality:

**1. Minimal LaTeX package set, derived empirically, not guessed.** The original Dockerfile
installed the `texlive` metapackage + `texlive-latex-extra` + `texlive-fonts-recommended` +
`texlive-luatex` + `ghostscript`. I compiled both actual templates (`resume.tex` and the inline
cover-letter template) from scratch in a throwaway container, starting from nothing and adding
exactly the Debian package that `pdflatex` reported missing each time, until both compiled
clean. The real requirement is:

```
texlive-base texlive-latex-base texlive-latex-recommended texlive-fonts-recommended texlive-latex-extra
```

`texlive-luatex` was never used — both routes only ever call `pdflatex`, never `lualatex`.
`ghostscript` was never used either — neither template has a single `\includegraphics`, so
nothing ever shells out to it. Both were pure dead weight. (`texlive-latex-extra` itself is
unfortunately unavoidable — `fullpage.sty`, `titlesec.sty`, and `enumitem.sty` only exist in
that bundle on Debian, there's no smaller package that provides just those three files.)

**2. `--no-install-recommends`.** Several texlive sub-packages pull in unrelated "recommended"
extras by default (a Ruby interpreter, Mesa Vulkan drivers, Perl HTML/XML parsers — all for
`texdoc`-style documentation viewers we never use). This flag skips all of that.

**3. A proper multi-stage build.** `next build` never touches `pdflatex` — LaTeX is only needed
at request time, not build time. So only the final runtime stage installs the LaTeX toolchain;
the build stage (which needs the full `node_modules` including devDependencies like TypeScript)
is discarded, and the final stage gets a fresh `npm ci --omit=dev` instead of carrying the
build-time dependency tree.

One related fix: `prisma` (the CLI) was a devDependency, but it's needed at runtime to run
migrations — moved it to `dependencies` in `package.json` so `--omit=dev` doesn't strip the
tool you actually need to run migrations with (see 2b).

**Result**: verified end-to-end with the full workflow still passing (sign-up, sign-in, save a
resume, AI-tailor it, download both the resume PDF and the cover-letter PDF) — **down from 6.5 GB
to 2.75 GB** (~58% smaller). See section 7 for the full measurement and a memory/instance
recommendation.

### 2b. Running migrations: not in the container's own startup

Prisma's `migrate deploy` does use an internal Postgres advisory lock, so running it
concurrently from two instances doesn't corrupt anything — but baking it into the container's
own startup script still isn't the right model:

- It re-runs (and re-pays the migration-check latency) on every container start, not once per
  release — including crash-loop restarts.
- A failed migration crash-loops the whole app instead of failing a discrete, visible deploy
  step.
- It conflates "release" (schema change) with "runtime" (serving requests) concerns.

**Recommendation**: run `npx prisma migrate deploy` as Render's **Pre-Deploy Command** (set this
in the service's Settings), which runs once against the new image before it takes traffic, not
on every container boot. See section 4 for where to set it.

If you ever deploy somewhere without a pre-deploy-command feature, you have two reasonable
fallbacks: run migrations manually (`docker exec <container> npx prisma migrate deploy`) right
after each deploy, or re-add the `npx prisma migrate deploy` line to the top of
`docker-entrypoint.prod.sh` — it's safe to run concurrently (Prisma's lock), just not ideal.

---

## 3. Environment variables

See `.env.example` for the full list. In production you need:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Managed Postgres connection string. Most managed Postgres providers (Render, Neon, Supabase) require `?sslmode=require` on the connection string for external connections — check your provider's dashboard for the exact string, it usually gives you the copy-pasteable one directly. |
| `OPENAI_API_KEY` | **Rotate this before going live.** An earlier version of this repo had a real key hardcoded in `compose.yaml`'s working tree (never committed to git, but it sat in plaintext on disk and was visible in terminal output many times during development) — treat that specific key as compromised and generate a new one at https://platform.openai.com/api-keys. |
| `NODE_ENV` | Set to `production`. Render/Railway/Fly set this automatically for most Node buildpacks, but with a raw Dockerfile deploy, set it explicitly — the production Dockerfile already sets `ENV NODE_ENV=production`, so you shouldn't need to add it again, but double-check your host isn't overriding it. |

Nothing in this app needs a `NEXT_PUBLIC_*` variable — there's no reason for any secret to be
readable from the browser, and none currently are (verified: `OPENAI_API_KEY` is only read in
server-only route handlers and `src/app/lib/openai.ts`).

---

## 4. Connecting GitHub -> Render -> Cloudflare

### GitHub

If this repo isn't already pushed to GitHub:

```bash
git remote add origin git@github.com:<your-username>/resume-tailor.git
git push -u origin main
```

### Render

1. Go to https://dashboard.render.com -> **New** -> **Web Service**.
2. Connect your GitHub account and select this repo.
3. Render should auto-detect the `Dockerfile` at the repo root (the production one). If it
   asks, set **Environment** to "Docker" and leave the Dockerfile path as the default.
4. Under **Environment Variables**, add `DATABASE_URL` and `OPENAI_API_KEY` (see above). Don't
   set `PORT` — Render provides it automatically and `next start` already reads it.
5. Under **Settings -> Pre-Deploy Command**, set it to `npx prisma migrate deploy`. This runs
   once against the new image before it takes traffic — see section 2b for why this matters
   more than it sounds like it should.
6. Pick an instance size. The free tier is fine to start; note free-tier services spin down
   after inactivity and take ~30-60s to wake on the next request — acceptable for a quiet beta,
   worth upgrading to a paid tier once you have steady traffic. See section 7 for a specific
   memory recommendation based on measured PDF-generation memory usage.
7. Separately, go to **New** -> **PostgreSQL**, create a database, and copy its **Internal
   Database URL** into the web service's `DATABASE_URL` environment variable (internal URL is
   faster and free; external URL works too if you need to connect from outside Render, e.g. to
   run `prisma studio` locally against prod — not recommended, but possible).
8. Deploy. Watch the build logs — this is where you'd catch a broken Dockerfile build before
   it reaches users.

### Cloudflare (domain + DNS)

1. If you don't already have the domain, register it anywhere (Cloudflare registrar or
   elsewhere) — registration itself isn't something I can or should do for you.
2. In Render, go to your web service -> **Settings** -> **Custom Domains** -> add your domain
   (e.g. `app.yourdomain.com`). Render will give you a CNAME target
   (e.g. `your-service.onrender.com`).
3. In Cloudflare's DNS dashboard for your domain, add a **CNAME** record: `app` ->
   `your-service.onrender.com`, with the orange-cloud proxy **on** (Cloudflare's default) —
   Render supports being proxied through Cloudflare.
4. In Cloudflare's SSL/TLS settings, use **Full** (not "Flexible") so traffic is encrypted all
   the way to Render, which already terminates TLS itself.
5. Wait for DNS to propagate (usually minutes, can take longer), then confirm the custom
   domain shows as verified in Render's dashboard.

---

## 7. Image size and memory usage (measured)

**Image size**: the original single-stage image (full `node:20-bookworm` base, full `texlive`
metapackage, `node_modules` including devDependencies) measured **6.5 GB**. The optimized
multi-stage image described in section 2a measured **2.75 GB** — about 58% smaller. Verified by
building both locally and comparing `docker images` output directly.

**Memory usage**: ran the full workflow (sign-up, sign-in, save resume, AI-tailor resume, AI-tailor
cover letter, generate resume PDF, generate cover-letter PDF) against a running container of the
optimized image, sampling `docker stats` during and immediately after each PDF-generation request
(including a burst of 3 concurrent resume-PDF + cover-letter-PDF requests, to approximate multiple
users hitting the app at once). Peak observed RSS across all samples: **~150 MB**. Idle baseline
(server up, no requests): ~95-110 MB.

**Instance recommendation**: Render's Starter plan (512 MB RAM) has roughly 3-4x headroom over the
measured peak and should run this comfortably for a small beta. If you expect many users
generating PDFs concurrently (each `pdflatex` invocation is a short-lived subprocess, not a
persistent memory cost, so the ceiling rises slowly with concurrency, not linearly per user), the
Standard plan (2 GB) gives a wide safety margin for very little extra cost and is the safer choice
if you'd rather not revisit this. Either plan clears the measured number; this came down to cost
preference, not a functional requirement.

---

## 8. Recommendations: monitoring, rate limiting, cost control, launch settings

- **Error monitoring**: add [Sentry](https://sentry.io)'s free tier (`@sentry/nextjs`) if you
  want visibility into production errors beyond Render's logs. Not strictly required for a
  10-20 user beta — Render's own log viewer is enough to start, and you can add this later
  without any migration cost.
- **Rate limiting / AI cost control**: already implemented server-side (`src/app/lib/
  rateLimit.ts`, 30 resume-tailors + 30 cover-letters per user per day, 10 sign-in attempts per
  15 minutes). This is in-memory, which is fine on Render/Railway/Fly's single persistent
  container model (confirmed this during the earlier production audit) — but if you ever scale
  to multiple instances, move this to a shared store (e.g. Upstash Redis) first, since each
  instance would otherwise get its own independent counter.
- **Secure launch settings**: session cookies are `httpOnly`, `sameSite=lax`, and `secure` in
  production (already conditional on `NODE_ENV === "production"` — confirm your host actually
  sets that, since the cookie silently stops being marked secure otherwise). Passwords are
  bcrypt-hashed. No secrets are exposed client-side (verified above).
- **Backups**: whichever managed Postgres you use, confirm it has automatic backups enabled
  (Render's paid Postgres tiers include daily backups; the free tier does not — worth knowing
  before you have real user data in it).

---

## 9. Deployment checklist

- [ ] Rotate the OpenAI API key (treat the one that was in `compose.yaml`'s working tree as
      compromised).
- [ ] Push this repo to GitHub.
- [ ] `docker build -t resume-tailor-prod -f Dockerfile .` succeeds locally.
- [ ] Create the Render web service (Dockerfile-based) and Render Postgres instance.
- [ ] Set `DATABASE_URL` and `OPENAI_API_KEY` in Render's environment variables.
- [ ] First deploy succeeds; confirm `prisma migrate deploy` ran cleanly in the deploy logs.
- [ ] Sign up a real test account against the live deployment; save a resume; tailor it against
      a real job description; download both the resume and cover-letter PDFs; confirm they
      open and render correctly.
- [ ] Add the custom domain in Render, add the CNAME in Cloudflare, set SSL/TLS mode to Full.
- [ ] Confirm the custom domain loads the app over HTTPS.
- [ ] Decide on and communicate your beta feedback channel (see the main README).

### What I can't verify for you

- Whether your actual Render/domain registrar accounts are set up correctly — I'm not
  deploying, registering a domain, or touching DNS myself, per your instructions.
- Real-world PDF compilation timing/behavior under your chosen host's CPU/memory limits (free
  tiers can be slow — `pdflatex` is not lightweight; test a real generation end-to-end before
  calling it launch-ready).
- Whether your Postgres provider's free tier is sufficient for your expected beta load — fine
  for 10-20 users, re-check before adding more.
