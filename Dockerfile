FROM node:lts-alpine as builder
WORKDIR /src
COPY package.json package-lock.json /src/
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/dist/kenwandererhaven /usr/share/nginx/html
EXPOSE 80
