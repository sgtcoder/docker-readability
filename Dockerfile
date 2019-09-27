FROM keymetrics/pm2:10-alpine

WORKDIR /application

COPY package.json .
COPY yarn.lock    .

RUN apk add git --no-cache ; \
    yarn install --prod ; \
    apk del git ; \
    yarn cache clean

COPY pm2.json .
COPY src      src

CMD [ "pm2-runtime", "start", "pm2.json" ]
