# Shopizer Admin (Next.js)

Sibling App Router app for the Angular → Next.js migration. Angular in `src/` stays the live admin until the cutover slice.

Root CircleCI still builds **Angular only** (`node:12.22.7` + `ng build --prod`). Do not point that job at this folder. `next/` is also listed in the root `.dockerignore` so the nginx image is unchanged.

Requires **Node >= 20**.

## Run locally

Point the API at a running Shopizer (defaults match Angular `environment.ts`):

```bash
cd next
cp .env.example .env.local
npm i
npm run dev
```

Open http://localhost:3000 — `/` goes to `/pages/home` when a JWT is in `localStorage.token`, otherwise `/auth`.

Slice 1: login / logout / forgot / register / reset, role-filtered sidebar, home store card. JWT stays in `localStorage` (plus a readable `token` cookie so middleware can gate `/pages`). Not httpOnly. Default login `admin@shopizer.com` / `password` against a running Shopizer.

Slice 2: `/pages/user-management/profile`, `change-password` (any signed-in user), `create-user`, `users`, `user/:id` (SUPERADMIN | ADMIN | ADMIN_RETAIL). Same `/v1/private/user(s)` contract as Angular. No store-management screens.

Browser calls same-origin `/api/*`, which Next rewrites to `SHOPIZER_API_URL` (including the `/api` suffix). Shipping rules use `/shipping-api/*` → `SHOPIZER_SHIPPING_API_URL`. Do not strip `/v1`.

```bash
npm test
npm run lint
npm run build
```

## Env

See `.env.example`.

| Variable | Angular equivalent | Default |
|---|---|---|
| `SHOPIZER_API_URL` | `environment.apiUrl` | `http://localhost:8080/api` |
| `SHOPIZER_SHIPPING_API_URL` | `environment.shippingApi` | `http://localhost:9090/shipping/api/v1` |
| `NEXT_PUBLIC_MODE` | `environment.mode` (`STANDARD` / `MARKETPLACE` / `BTB`) | `STANDARD` |
| `NEXT_PUBLIC_DEFAULT_LANG` | `environment.client.language.default` | `en` |
| `NEXT_PUBLIC_LANGS` | `environment.client.language.array` | `en,fr` |
