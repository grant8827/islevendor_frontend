import { Route, Routes } from 'react-router-dom';
import Layout from './Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StorefrontPage from './pages/StorefrontPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import OpportunityPage from './pages/opportunities/OpportunityPage.jsx';
import WarehouseOnboardingPage from './pages/onboarding/WarehouseOnboardingPage.jsx';
import ResellerOnboardingPage from './pages/onboarding/ResellerOnboardingPage.jsx';
import VendorOnboardingPage from './pages/onboarding/VendorOnboardingPage.jsx';
import DriverOnboardingPage from './pages/onboarding/DriverOnboardingPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Home is a self-contained Amazon-style page with its own header/footer —
          it deliberately doesn't use the simple Layout used by the rest of the app. */}
      <Route path="/" element={<HomePage />} />

      {/* Product detail and cart are also self-contained, same reasoning as
          Home — full-width Amazon-style pages, not the simple Layout. */}
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Explainer pages for the "join us" CTAs on the home page — each has
          its own Apply button, which now goes to a dedicated ISLE-100
          onboarding wizard below rather than the generic /register form. */}
      <Route path="/opportunities/:slug" element={<OpportunityPage />} />

      {/* ISLE-101..104: dedicated multi-step onboarding portals — each is a
          self-contained public page (own Navbar, like Home/Product/Cart —
          not the simple Layout), since these are reached pre-login from the
          opportunity pages' Apply buttons. */}
      <Route path="/join/warehouse" element={<WarehouseOnboardingPage />} />
      <Route path="/join/reseller" element={<ResellerOnboardingPage />} />
      <Route path="/join/vendor" element={<VendorOnboardingPage />} />
      <Route path="/join/driver" element={<DriverOnboardingPage />} />

      {/* Dashboard is also self-contained (sidebar layouts for warehouse/reseller
          roles need full width, not the simple Layout's centered 720px column). */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Account & Orders — same "self-contained full-width page" reasoning
          as Home/Product/Cart above, plus it needs a logged-in user. */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/store/:slug" element={<StorefrontPage />} />
      </Route>
    </Routes>
  );
}
