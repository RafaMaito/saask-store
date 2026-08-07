# Estágio de Compilação (Build Stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Execução em Produção (Production Execution Stage)
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
