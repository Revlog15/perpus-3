FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || npm install
COPY . .
ENV PORT=5001
ENV BASE_PATH=/demos/perpus-3
EXPOSE 5001
CMD ["npm", "start"]
