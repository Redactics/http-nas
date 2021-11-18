FROM node:12-buster

RUN apt update && apt install -y vim
RUN npm install -g pm2

WORKDIR /src
COPY package.json /src/
RUN npm install
ENV PATH="/src/node_modules/.bin:${PATH}"
COPY . /src
RUN tsc || true

CMD ["pm2-runtime", "-i", "max", "build/server.js"]