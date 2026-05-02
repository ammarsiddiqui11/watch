// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";

import { ThemeProvider } from "./context/ThemeContext";

import Home from "./pages/Home/Home";
import Watches from "./pages/Watches/Watches";
import Brand from "./pages/Brand/Brand";
import Contact from "./pages/Contact/Contact";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import Cart from "./pages/Cart/Cart";
import Orders from "./pages/Orders/Orders";
import VerifyPaymentPage from "../VerifyPaymentPage";
import WatchDetail from "./pages/WatchDetail/WatchDetail";
import MyOrders from "./pages/MyOrders/MyOrders";

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("authToken"));
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

export default function App() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowButton(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.documentElement.style.overflowX = "";
      document.body.style.margin = "";
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <ThemeProvider>
      {/* Root div carries dark-mode background so the whole page goes dark */}
      <div className="min-h-screen w-screen overflow-x-hidden antialiased bg-white dark:bg-slate-950 transition-colors duration-300">
        <ScrollToTopOnRouteChange />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/watches/:id" element={<WatchDetail />} />
          <Route path="/watches" element={<Watches />} />
          <Route path="/brands/:brandName" element={<Brand />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/orders/success" element={<VerifyPaymentPage />} />
          <Route path="/orders/cancel" element={<VerifyPaymentPage />} />
        </Routes>

        {/* Scroll to top */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`fixed right-6 bottom-6 z-50 flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300
            bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100
            ${showButton ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"}`}
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </ThemeProvider>
  );
}