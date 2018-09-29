FROM node:8.12.0-alpine
LABEL mantainer Francesco Tonini <francescoantoniotonini@gmail.com>
ENV REFRESHED_AT 2018-09-18

WORKDIR /src

COPY package.json .
RUN yarn install --production
COPY . .

# Set envs
ENV NODE_ENV=production

# Expose ports to host
EXPOSE 6000

# Start
CMD ["node", "/src/index.js"]