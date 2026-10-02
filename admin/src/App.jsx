import React, {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import { Login } from "./Login";
import { Layout } from "./Layout";

// Lazy-loaded pages
const Dashboard = lazy(() =>
  import("./Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);

const ProductsPage = lazy(() =>
  import("./Catalog").then((module) => ({
    default: module.ProductsPage,
  })),
);

const CategoriesPage = lazy(() =>
  import("./Catalog").then((module) => ({
    default: module.CategoriesPage,
  })),
);

const OrdersPage = lazy(() =>
  import("./Orders").then((module) => ({
    default: module.OrdersPage,
  })),
);

const CustomersPage = lazy(() =>
  import("./Customers").then((module) => ({
    default: module.CustomersPage,
  })),
);

const MerchandisingPage = lazy(() =>
  import("./Merchandising").then((module) => ({
    default: module.MerchandisingPage,
  })),
);

// Toast context
const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

// Loading screen
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="spinner" />
      Loading your workspace
    </div>
  );
}

// Main App
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(
    Boolean(localStorage.getItem("clothes-admin-token")),
  );
  const [toast, setToast] = useState(null);

  // Verify logged-in user
  useEffect(() => {
    let active = true;

    const token = localStorage.getItem("clothes-admin-token");

    if (!token) {
      setChecking(false);
      return undefined;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (active && data.user?.role === "admin") {
          setUser(data.user);
        } else if (active) {
          localStorage.removeItem("clothes-admin-token");
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem("clothes-admin-token");
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Show notification
  const notify = (message, type = "success") => {
    setToast({ message, type });
  };

  // Sign out
  const signOut = () => {
    localStorage.removeItem("clothes-admin-token");
    setUser(null);
    setToast(null);
  };

  // Authentication loading
  if (checking) {
    return <LoadingScreen />;
  }

  return (
    <ToastContext.Provider value={notify}>
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={setUser} notify={notify} />
            )
          }
        />

        {/* Protected admin layout */}
        <Route
          path="/"
          element={
            user ? (
              <Layout user={user} onLogout={signOut} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<LoadingScreen />}>
                <Dashboard />
              </Suspense>
            }
          />

          {/* Products */}
          <Route
            path="products"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <ProductsPage />
              </Suspense>
            }
          />

          {/* Categories */}
          <Route
            path="categories"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <CategoriesPage />
              </Suspense>
            }
          />

          {/* Orders */}
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <OrdersPage />
              </Suspense>
            }
          />

          {/* Customers */}
          <Route
            path="customers"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <CustomersPage />
              </Suspense>
            }
          />

          {/* Merchandising */}
          <Route
            path="merchandising"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <MerchandisingPage />
              </Suspense>
            }
          />
        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </ToastContext.Provider>
  );
}
