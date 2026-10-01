# Clothes Store Admin

React, Vite, Tailwind CSS, and Axios admin dashboard for the existing Clothes Store API.

## Requirements

- Node.js 20 or newer
- The backend running at `http://localhost:5000`
- A reachable MongoDB database configured in `backend/.env`

## Run locally

In one terminal, start the API:

```powershell
cd D:\clothes-store\backend
npm install
npm start
```

In a second terminal, start the admin UI:

```powershell
cd D:\clothes-store\admin
npm install
npm run dev
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

## First administrator

Before starting the backend, set `MONGO_URI`, a `JWT_SECRET` with at least 32 characters, and `ADMIN_SETUP_KEY` in `backend/.env`. The Vite development server proxies `/api` to the backend, so the admin does not need to be added to the backend CORS allowlist. Keep the storefront origin in `CORS_ORIGIN` when serving the static storefront from a separate port, for example:

```env
CORS_ORIGIN=http://localhost:5500
```

On the admin sign-in screen, choose **First time here? Set up your administrator** and submit the name, email, a password of at least 10 characters, and the one-time setup key. The backend permits setup only while no administrator exists. Rotate or remove the setup key after creating the account. Sign in normally afterward; the dashboard uses the backend's JWT and role checks.

Do not commit `.env` files or use development secrets in production. Serve both the admin UI and API over HTTPS in production.

## Features

- Dashboard counts, confirmed revenue, seven-day activity, pending orders, and recent orders
- Product search and filtering, create/edit/archive/restore, image URLs, prices, category, sizes, colors, stock, active and featured controls
- Category create/edit/archive/restore
- Paginated order list, order/customer search, shipping details, and fulfillment/payment status updates
- Customer search and profiles for registered accounts and guest purchasers, with order history matched by email
- Storefront catalog reads from the existing public product/category APIs on `products-list.html`, `collections.html`, and product detail pages

Product images are managed as image URLs, matching the existing API model; binary image uploads and storage are not currently configured.

Set `VITE_API_URL` in an admin `.env` file when the API is hosted somewhere other than the local Vite proxy.