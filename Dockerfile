FROM node:8.9.1-alpine
MAINTAINER Francesco Tonini <francescoantoniotonini@gmail.com>
ENV REFRESHED_AT 2017-11-14

COPY . /src
RUN cd /src && npm install --production

EXPOSE 4000

CMD ["node", "/src/index.js"]
