FROM node:18-alpine

WORKDIR /app

RUN apk update && apk upgrade
RUN apk add --no-cache openssl


COPY package*.json ./
RUN npm install

COPY . .


EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"] 