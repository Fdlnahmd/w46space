# Step 1: Build stage
FROM node:22-alpine AS build-stage

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin semua file project
COPY . .

# Terima build arg dari docker-compose
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build aplikasi untuk production
RUN npm run build

# Step 2: Production stage (Nginx)
FROM nginx:stable-alpine AS production-stage

# Salin hasil build dari build-stage ke direktori html Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Salin konfigurasi Nginx khusus (untuk mendukung React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
