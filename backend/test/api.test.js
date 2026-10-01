const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');

async function withServer(run) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('health endpoint reports API status without a database', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', database: 'disconnected' });
  });
});

test('unknown API route returns structured 404 JSON', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    assert.equal(response.status, 404);
    assert.match((await response.json()).error, /Route not found/);
  });
});

test('admin routes reject requests without a bearer token', async () => {
  await withServer(async (baseUrl) => {
    for (const path of ['/api/admin/dashboard', '/api/admin/products', '/api/admin/categories', '/api/admin/customers', '/api/admin/customers/test@example.com/orders', '/api/admin/uploads/signature', '/api/coupons', '/api/banners/admin', '/api/users']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, path);
      assert.deepEqual(await response.json(), { error: 'Authentication required' }, path);
    }
  });
});

test('customer order history requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/me/orders`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Authentication required' });
  });
});

test('order creation validates its body before requiring a database', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Missing required fields/);
  });
});

test('customer registration validates input before requiring a database', async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      { body: {}, message: /Missing required fields/ },
      { body: { name: 'Customer', email: 'invalid', password: 'long-enough-password' }, message: /valid email/ },
      { body: { name: 'Customer', email: 'customer@example.com', password: 'short' }, message: /between 10 and 128/ },
    ];
    for (const { body, message } of cases) {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
      assert.match((await response.json()).error, message);
    }
  });
});

test('coupon validation rejects incomplete preview requests before database access', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /discount code and valid subtotal/);
  });
});

test('coupon validation rejects malformed codes before database access', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'BAD CODE', subtotal: 25 }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /invalid or expired/);
  });
});

test('order creation rejects invalid product ids before database access', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Test Customer', email: 'test@example.com', phone: '5550100' },
        shippingAddress: { line1: '1 Test Street', city: 'Test City', region: 'CA', postalCode: '90001', country: 'US' },
        items: [{ product: 'not-a-product-id', quantity: 1 }],
      }),
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid product id' });
  });
});

test('malformed JSON gets a client error response', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Malformed JSON request body' });
  });
});

test('Mongoose models enforce key invalid values', async () => {
  const product = new Product({ name: 'Shirt', slug: 'shirt', price: -1, category: '507f1f77bcf86cd799439011' });
  const order = new Order({ orderNumber: 'test', items: [{ product: '507f1f77bcf86cd799439011', name: 'Shirt', quantity: 0, unitPrice: 2 }], subtotal: 2, total: 2 });
  const category = new Category({ name: 'A', slug: 'not valid slug' });
  const coupon = new Coupon({ code: 'bad code', discountType: 'other', discountValue: -2 });
  const banner = new Banner({ title: 'A' });
  assert.ok((await product.validate().catch((error) => error)).errors.price);
  assert.ok((await order.validate().catch((error) => error)).errors['items.0.quantity']);
  assert.ok((await category.validate().catch((error) => error)).errors.slug);
  assert.ok((await coupon.validate().catch((error) => error)).errors.code);
  assert.ok((await coupon.validate().catch((error) => error)).errors.discountType);
  assert.ok((await banner.validate().catch((error) => error)).errors.imageUrl);
});
