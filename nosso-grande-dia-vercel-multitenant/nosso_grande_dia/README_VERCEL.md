# Deploy on Vercel

This project uses Vercel's zero-configuration Node.js server deployment.

- `server.ts` is the production entry point.
- `app.ts` contains the Express application and API routes.
- `backend/db.ts` handles Upstash Redis persistence.
- `npm run build` creates the Vite `dist` frontend.
- In production, `server.ts` serves `dist` and the `/api/*` routes from the same Express app.

The `api/` Serverless Function wrapper is intentionally not used; this avoids a second runtime/bundling path for the same Express application.
