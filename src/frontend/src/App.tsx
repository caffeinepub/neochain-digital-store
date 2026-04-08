import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { UserProfile } from "./backend.d";
import CustomerSupportWidget from "./components/CustomerSupportWidget";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import RegisterModal from "./components/RegisterModal";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPanel from "./pages/AdminPanel";
import ContactPage from "./pages/ContactPage";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MobileAppsPage from "./pages/MobileAppsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProductsPage from "./pages/ProductsPage";
import RefundPage from "./pages/RefundPage";
import RegisterPage from "./pages/RegisterPage";
import SitemapPage from "./pages/SitemapPage";
import TermsPage from "./pages/TermsPage";

const ADMIN_SESSION_KEY = "neochain_admin_authenticated";

function RootLayout() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  const [showRegister, setShowRegister] = useState(false);
  const [signUpIntent, setSignUpIntent] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  // Standalone pages (/login, /register) handle their own auth UI
  const isStandalonePage =
    location.pathname === "/login" || location.pathname === "/register";

  // Auto-show register modal after login if no profile exists (only on non-standalone pages)
  useEffect(() => {
    if (!identity || !actor || isFetching || isStandalonePage) return;
    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile === null) {
          setShowRegister(true);
        } else if (signUpIntent) {
          setSignUpIntent(false);
        }
      })
      .catch(() => {});
  }, [identity, actor, isFetching, signUpIntent, isStandalonePage]);

  useEffect(() => {
    if (loginStatus === "idle") {
      setShowRegister(false);
      setSignUpIntent(false);
    }
  }, [loginStatus]);

  const handleRegistered = (_profile: UserProfile) => {
    setShowRegister(false);
    setSignUpIntent(false);
  };

  const handleSignUpClick = () => {
    setSignUpIntent(true);
  };

  const toastStyle = {
    background: "rgba(10, 8, 30, 0.95)",
    border: "1px solid rgba(123, 77, 255, 0.4)",
    color: "oklch(0.96 0.01 280)",
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen cyber-grid-bg">
        <Outlet />
        <Toaster theme="dark" toastOptions={{ style: toastStyle }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cyber-grid-bg">
      <Navbar
        onSignUpClick={handleSignUpClick}
        onBuyPlan={() => setWalletOpen(true)}
        walletOpen={walletOpen}
        onWalletClose={() => setWalletOpen(false)}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CustomerSupportWidget />
      <Toaster theme="dark" toastOptions={{ style: toastStyle }} />
      {showRegister && identity && actor && (
        <RegisterModal
          actor={actor}
          onRegistered={handleRegistered}
          onClose={() => setShowRegister(false)}
        />
      )}
    </div>
  );
}

function ProtectedDashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isInitializing && !identity) navigate({ to: "/" });
  }, [identity, isInitializing, navigate]);
  if (isInitializing || !identity) return null;
  return <Dashboard />;
}

function ProtectedAdmin() {
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const handleLogin = () => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setAdminAuthenticated(true);
  };

  if (!adminAuthenticated) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }
  return <AdminPanel />;
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsPage,
});
const mobileAppsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mobile-apps",
  component: MobileAppsPage,
});
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: ProtectedDashboard,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: ProtectedAdmin,
});
const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});
const refundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/refund",
  component: RefundPage,
});
const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});
const sitemapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sitemap",
  component: SitemapPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  productsRoute,
  mobileAppsRoute,
  contactRoute,
  dashboardRoute,
  adminRoute,
  privacyRoute,
  refundRoute,
  termsRoute,
  sitemapRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

export { useNavigate, useLocation };
