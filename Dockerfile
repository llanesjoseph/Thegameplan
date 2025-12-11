FROM node:20-slim

WORKDIR /app

# Copy package files
COPY functions/package*.json ./
RUN npm ci --only=production

# Copy function code
COPY functions/ ./

# Set environment
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Start the server
CMD ["node", "index.js"]