FROM node:lts
WORKDIR /app
COPY . .
RUN rm -rf node_modules package-lock.json
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]
