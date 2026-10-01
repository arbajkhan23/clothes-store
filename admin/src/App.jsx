import { createContext, lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, errorMessage } from './api';
import { Login } from './Login';
import { Layout } from './Layout';

const Dashboard = lazy(() => import('./Dashboard').then((module) => ({ default: module.Dashboard })));
const ProductsPage = lazy(() => import('./Catalog').then((module) => ({ default: module.ProductsPage })));
const CategoriesPage = lazy(() => import('./Catalog').then((module) => ({ default: module.CategoriesPage })));
const OrdersPage = lazy(() => import('./Orders').then((module) => ({ default: module.OrdersPage })));
const CustomersPage = lazy(() => import('./Customers').then((module) => ({ default: module.CustomersPage })));
const MerchandisingPage = lazy(() => import('./Merchandising').then((module) => ({ default: module.MerchandisingPage })));

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

function LoadingScreen() {
  return <div className="loading-screen"><span className="spinner" />Loading your workspace</div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('clothes-admin-token')));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('clothes-admin-token')) return undefined;
    api.get('/auth/me')
      .then(({ data }) => {
        if (active && data.user.role === 'admin') setUser(data.user);
        else if (active) localStorage.removeItem('clothes-admin-token');
      })
      .catch(() => localStorage.removeItem('clothes-admin-token'))
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = (message, type = 'success') => setToast({ message, type });
  const signOut = () => {
    localStorage.removeItem('clothes-admin-token');
    setUser(null);
  };

  if (checking) return <LoadingScreen />;

  return (
    <ToastContext.Provider value={notify}>
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} notify={notify} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={signOut} /> : <Navigate to="/login" replace />}>
          <Route index element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<LoadingScreen />}><ProductsPage /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<LoadingScreen />}><CategoriesPage /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<LoadingScreen />}><OrdersPage /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<LoadingScreen />}><CustomersPage /></Suspense>} />
          <Route path="merchandising" element={<Suspense fallback={<LoadingScreen />}><MerchandisingPage /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </ToastContext.Provider>
  );
}