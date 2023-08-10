FROM node:14

WORKDIR /app
COPY ./package.json ./package-lock.json /app/
RUN npm install

COPY ./index.js ./User.js ./Dockerfile /app/

CMD [ "node", "index" ]