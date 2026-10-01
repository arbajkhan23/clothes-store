# Clothes Store API

Node.js and Express API for the clothes store. MongoDB Atlas credentials and secrets are intentionally placeholders. The React admin dashboard lives in `../admin`.

## Requirements

- Node.js 20 or newer
- A MongoDB Atlas cluster and database user

## Setup

1. From `backend/`, install packages with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET` (at least 32 characters), and `ADMIN_SETUP_KEY` to private values. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable signed admin image uploads. Keep both development frontend origins in `CORS_ORIGIN`, such as `http://localhost:5173,http://localhost:5500`.
3. In MongoDB Atlas, allow the API host in Network Access and ensure the database user can access the database.
4. Run `npm run dev` for development or `npm start` for production.
5. Check `GET http://localhost:5000/api/health`.
6. Create the first administrator once with `POST /api/auth/setup-admin`, passing `{ "name", "email", "password", "setupKey" }`, or use the admin setup screen. Remove/rotate `ADMIN_SETUP_KEY` after setup. This endpoint refuses setup after an admin exists.

`backend/.env` is ignored by Git. Never commit real connection strings or secrets.

## Scripts

- `npm start` starts the API.
- `npm run dev` starts the API with nodemon.
- `npm test` runs the Node.js test suite without requiring an Atlas connection.

## API

All request and response bodies are JSON. List endpoints accept `page` and `limit` (maximum 100).

- `GET /api/health`
- `POST /api/auth/setup-admin`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id-or-slug`; admin: `POST`, `PATCH /:id`, `DELETE /:id`
- `GET /api/categories`, `GET /api/categories/:id-or-slug`; admin: `POST`, `PATCH /:id`, `DELETE /:id`
- `POST /api/orders` creates a guest order; admin: `GET /api/orders`, `GET /:id`, `PATCH /:id`
- `POST /api/coupons/validate` previews an active discount; admin: `GET/POST /api/coupons`, `PATCH/DELETE /:id`
- `GET /api/banners` lists active storefront campaigns; admin: `GET /api/banners/admin`, `POST /api/banners`, `PATCH/DELETE /:id`
- Admin-only user management: `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id`
- Customer account history: `GET /api/users/me/orders` (authenticated customer only)
- `GET /api/admin/dashboard`, `/api/admin/products`, `/api/admin/categories`, `/api/admin/customers`
- `GET /api/admin/customers/:email/orders`
- `POST /api/admin/uploads/signature` returns a short-lived signed upload payload for Cloudinary; image files upload directly from the admin browser.

For protected routes send `Authorization: Bearer <token>`. Product/category deletion archives the record. Order creation recalculates prices from MongoDB and atomically decrements available product stock; cancellation restocks the order. Order status values are `pending`, `processing`, `shipped`, `delivered`, and `cancelled`; payment values are `pending`, `paid`, `refunded`, and `failed`.

The API does not implement a payment gateway. Mark payment status only after a trusted payment provider confirms the transaction.
