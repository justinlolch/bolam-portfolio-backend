# ===== 1) Build stage =====
FROM node:20-alpine AS builder
LABEL authors="justinlo"
WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# ===== 2) Runtime stage =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8082

# install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# bring in compiled app + prisma bits
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# <-- bake env into image (LOCAL/DEV ONLY—contains secrets)
COPY .env .env

EXPOSE 8082

# apply migrations then run app
CMD ["/bin/sh", "-c", "npx prisma db push && node dist/main.js"]
