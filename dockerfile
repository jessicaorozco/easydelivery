# Dockerfile
FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV APP_VERSION=1.0.0

EXPOSE 3000

CMD [ "node", "app.js" ]