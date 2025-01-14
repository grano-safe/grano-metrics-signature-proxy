FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable && yarn install

COPY . .

RUN yarn build

EXPOSE 3020

CMD ["node", "dist/index.js"]
