FROM node:16-alpine
WORKDIR /app
# add curl for healthcheck
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node","server.js"]
