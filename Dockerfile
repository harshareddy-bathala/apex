# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci

COPY . .

# Allow backend URL override during build for static env injection
ARG VITE_MENTOR_BACKEND_URL
ENV VITE_MENTOR_BACKEND_URL=${VITE_MENTOR_BACKEND_URL}

RUN npm run build

FROM nginx:1.25-alpine AS runner

# Copy nginx configuration first to leverage Docker layer caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -q -O - http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
