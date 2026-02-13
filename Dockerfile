FROM node:18-bullseye
WORKDIR /app

RUN apt-get update && apt-get install -y \
    texlive \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-luatex \
    ghostscript \
    && apt-get clean


COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate


EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"] 