FROM node:12-bullseye-slim

RUN apt update && apt install -y curl

WORKDIR /src
COPY package.json /src/
RUN npm install
ENV PATH="/src/node_modules/.bin:${PATH}"
COPY . /src
RUN tsc

RUN useradd -u 2000 -ms /bin/bash nas && \
    chown -R nas /tmp
USER nas

CMD ["pm2-runtime", "-i", "max", "build/server.js"]