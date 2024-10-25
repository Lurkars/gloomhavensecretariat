FROM node:lts-alpine as builder
WORKDIR /src
COPY package.json /src/
RUN npm i
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/dist/gloomhavensecretariat /usr/share/nginx/html
EXPOSE 80
