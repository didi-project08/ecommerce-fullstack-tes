FROM node:18-alpine

# Install wait-for script dependencies
RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy wait script (opsional, untuk menunggu MySQL siap)
COPY wait-for.sh /wait-for.sh
RUN chmod +x /wait-for.sh

RUN npm run build

EXPOSE 3001

# Gunakan wait script jika perlu
CMD ["npm", "run", "start:prod"]