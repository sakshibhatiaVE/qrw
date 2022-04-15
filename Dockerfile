
# Stage 1: base images
FROM node:lts-alpine as base

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

# setup pm2
RUN npm install -g pm2

ADD --chown=node:node package.json .

RUN npm install --unsafe-perm=true

ADD --chown=node:node . .

RUN npm run build

USER node

#WORKDIR /home/node/app/dist

CMD NODE_ENV=production pm2-runtime start dist/app.js --name=TransportTVBackend-$APP_NAME

ENV NODE_OPTIONS=--max_old_space_size=8096
