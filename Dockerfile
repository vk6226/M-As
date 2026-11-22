# ====================================================
# AURA M&A — production image
# Stage 1 builds the app; stage 2 runs a small Node server that serves the
# static build and the live data proxies (SEC EDGAR + NSE India).
# ====================================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=builder /app/dist ./dist
COPY server ./server
USER node
EXPOSE 8080
# Set SEC_USER_AGENT="Your Company you@yourcompany.com" at runtime.
CMD ["node", "server/index.mjs"]
