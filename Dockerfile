# ==============================
# Stage 1 — Build Angular
# ==============================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production


# ==============================
# Stage 2 — Nginx
# ==============================
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/dist/lista-compra-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK CMD wget -qO- http://localhost || exit 1
