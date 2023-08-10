FROM node:14

COPY . /app/
WORKDIR /app

RUN npm install

COPY ./index.js ./Order.js ./Dockerfile /app/

CMD [ "node", "index" ]