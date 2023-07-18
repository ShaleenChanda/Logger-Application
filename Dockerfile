FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm i -g concurrently
COPY . .
EXPOSE 3000
CMD ["concurrently","\"npm start\"","\"node writelogs.js\""]