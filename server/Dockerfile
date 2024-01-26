FROM node:14-alpine AS builder
ENV NODE_ENV production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY server/package.json .
RUN pnpm i
COPY server/ .

RUN pnpm i && pnpm i nodemon --save-dev

EXPOSE 5000
CMD ["yarn", "start-prod"]
