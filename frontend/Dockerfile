# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# --- Stage 2: For static export only ---
FROM alpine AS static-export
WORKDIR /app
COPY --from=build /app/dist ./
