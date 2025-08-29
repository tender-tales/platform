# UI Frontend

Next.js frontend for Tender Tales platform.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_BACKEND_HOST` - Backend API host
- `NEXT_PUBLIC_BACKEND_PORT` - Backend API port
- `NEXT_PUBLIC_FRONTEND_PORT` - Frontend port

## Docker

```bash
docker build -t tender-tales-ui .
docker run -p 3000:3000 tender-tales-ui
```
