FROM node:24-alpine AS builder
WORKDIR /src
COPY package.json /src/
COPY package-lock.json /src/
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/dist/gloomhavensecretariat /usr/share/nginx/html
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh
EXPOSE 80
