FROM node:9-alpine
COPY . /app

RUN npm i -g nodemon

WORKDIR /app
RUN npm i