# shopizer-next-admin

Incremental Next.js spike of the Angular Shopizer admin.

**Chosen first screen:** Angular `#/auth` login (`LoginComponent`).

This app does **not** replace `src/`. The Angular admin stays the production UI.
The spike proves one screen against the existing Spring Boot API
(`POST /v1/private/login`, then `GET /v1/private/user/profile`).

## Run locally

Requires the Shopizer API (default `http://localhost:8080/api`). Do not change
the Spring Boot repo for this spike.

```bash
cd next-admin
cp .env.example .env.local
npm install
npm test
npm run dev
```

Open http://localhost:3000 — it redirects to `/login`.

Default demo credentials (same as Angular README):

- Username: `admin@shopizer.com`
- Password: `password`

## What is in / out of scope

In:

- Login form, validation, remember-username, token + role storage
- Same-origin rewrite to the existing Shopizer API (CORS-safe locally)
- A tiny `/session` confirmation that the Bearer token works

Out:

- Catalog, orders, shipping, tax, content, register, forgot-password
- Nebular theme / full layout
- Any IoT or device features
- Changes to https://github.com/DeftEye/shopizer
