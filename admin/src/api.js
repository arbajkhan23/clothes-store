import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clothes-admin-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(error) {
  return error.response?.data?.error || error.message || 'Something went wrong. Please try again.';
}

export function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

export async function uploadCloudinaryImage(file) {
  if (!file?.type.startsWith('image/')) throw new Error('Choose a valid image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.');
  const { data: signature } = await api.post('/admin/uploads/signature');
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signature.apiKey);
  body.append('folder', signature.folder);
  body.append('timestamp', String(signature.timestamp));
  body.append('signature', signature.signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, { method: 'POST', body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'The image could not be uploaded.');
  return result.secure_url;
}

export function shortDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}