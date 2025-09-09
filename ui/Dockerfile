# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG WEB3FORMS_ACCESS_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV WEB3FORMS_ACCESS_KEY=${WEB3FORMS_ACCESS_KEY} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN addgroup -S nextjs && \
    adduser -S -G nextjs nextjs && \
    chown -R nextjs:nextjs /app

# Install sharp for production Image Optimization
RUN apk add --no-cache vips-dev
RUN npm install --platform=linuxmusl --arch=x64 sharp

USER nextjs

COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
