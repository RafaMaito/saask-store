# Estágio de Compilação do Frontend (Frontend Multi-stage Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Servidor Nginx em Produção (Nginx Web Server Container Stage)
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração de Proxy Nginx (Nginx Reverse Proxy Configuration)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
  } \
  location /api/ { \
    proxy_pass http://backend:5000/api/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_cache_bypass $http_upgrade; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
