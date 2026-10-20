# Production image, multi-stage build.
#
# Only the final "runner" stage needs the LaTeX toolchain (pdflatex runs at
# request time, not at build time) -- so it's the only stage that pays for
# it, and the final image doesn't carry npm's build-time cache or dev
# dependencies.
#
# For local dev (hot reload, volume-mounted source), use Dockerfile.dev via
# `docker compose up` instead -- this file is what a Docker-native host
# (Render, Railway, Fly.io, etc.) picks up by default.

# ---- deps: install all dependencies (incl. dev, needed to build) ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- builder: compile the app ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal runtime + only the LaTeX packages pdflatex needs ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Exact package set empirically verified against both PDF templates
# (resume.tex and the inline cover-letter template) -- see DEPLOYMENT.md for
# how this was derived. Notably: no texlive-luatex (we only ever call
# pdflatex, never lualatex) and no ghostscript (neither template embeds
# graphics, so nothing ever shells out to it).
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-base \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Production-only node_modules (devDependencies -- typescript, eslint,
# tailwind -- aren't needed at runtime; their output is already baked into
# .next by the builder stage). `prisma` itself is a regular dependency
# (not dev) because its CLI is needed here for `prisma migrate deploy`.
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src/app/lib/resume.tex ./src/app/lib/resume.tex
COPY docker-entrypoint.prod.sh ./

# `npm ci --omit=dev` above installs a fresh node_modules, which does NOT
# carry over the @prisma/client generated output from the builder stage --
# that generated code lives inside node_modules and gets wiped out by the
# fresh install. Regenerate it here, against the production node_modules.
RUN npx prisma generate

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.prod.sh"]
