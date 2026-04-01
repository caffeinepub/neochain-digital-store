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
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import TermsPage from "./pages/TermsPage";

function RootLayout() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  const [showRegister, setShowRegister] = useState(false);
  const [signUpIntent, setSignUpIntent] = useState(false);

  // Auto-show register modal after login if no profile exists
  useEffect(() => {
    if (!identity || !actor || isFetching) return;
    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile === null) {
          setShowRegister(true);
        } else if (signUpIntent) {
          // Already has profile, just clear intent
          setSignUpIntent(false);
        }
      })
      .catch(() => {});
  }, [identity, actor, isFetching, signUpIntent]);

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
      <Navbar onSignUpClick={handleSignUpClick} />
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
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  if (!adminAuthenticated) {
    return <AdminLoginPage onLogin={() => setAdminAuthenticated(true)} />;
  }
  return <AdminPanel />;
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  adminRoute,
  privacyRoute,
  refundRoute,
  termsRoute,
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
