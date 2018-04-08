FROM node:8.10.0-alpine
MAINTAINER Francesco Tonini <francescoantoniotonini@gmail.com>
ENV REFRESHED_AT 2018-04-08

COPY . /src
RUN cd /src && yarn install --prod

EXPOSE 6000

CMD ["node", "/src/index.js"]
