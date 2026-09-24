# Shopizer admin — Next.js spike

Incremental slice: login + **orders list**. The Angular app at the repo root remains the production admin.

## Run

```bash
cd apps/next-admin
cp .env.example .env.local   # optional; defaults already match Angular environment.ts
npm install
npm run dev
```

Open http://localhost:3000 → `/login`, then `/orders`.

Shopizer API must be reachable at `SHOPIZER_API_URL` (default `http://localhost:8080/api`). The Next server proxies `/shopizer-api/*` to that base so the browser does not need CORS.

Demo credentials from the Angular README (against a running backend): `admin@shopizer.com` / `password`.

## Build

```bash
npm run build
```

## Routes

| Path | Angular equivalent |
| --- | --- |
| `/login` | `#/auth` |
| `/orders` | `#/pages/orders/order-list` |

## API used

- `POST /v1/private/login`
- `GET /v1/private/user/profile`
- `GET /v1/private/orders`
