FROM debian:buster-slim

LABEL org.opencontainers.image.source="https://github.com/dadepo/tsfeed"


ENV DENO_VERSION=1.9.0

RUN apt-get -qq update \
 && apt-get -qq install -y --no-install-recommends curl ca-certificates unzip \
 && curl -fsSL https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip \
         --output deno.zip \
 && unzip deno.zip \
 && rm deno.zip \
 && chmod 777 deno \
 && mv deno /usr/bin/deno \
 && apt-get -qq remove --purge -y curl ca-certificates unzip \
 && apt-get -y -qq autoremove \
 && apt-get -qq clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN apt-get -qq update \
  && apt-get -qq install -y sqlite3 libsqlite3-dev

ENV DENO_DIR /deno-dir/

WORKDIR /usr/local/planetts/bin
COPY . .
RUN mv env.prod .env
RUN mkdir /usr/local/planetts/data/
RUN deno bundle --unstable server.ts /usr/local/planetts/bin/bundle.js

EXPOSE 4300/tcp

ENTRYPOINT ["deno"]
CMD ["run", "--allow-net", "--allow-read", "--location", "https://api.twitter.com/1.1/statuses/update.json", "--allow-write", "--allow-env", "--unstable", "/usr/local/planetts/bin/bundle.js"]
