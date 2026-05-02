// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Clock, ShoppingBag, User, Menu, X,
  ChevronDown, Package, LogOut, Sun, Moon,
} from "lucide-react";
import { useCart } from "../../CartContext";
import { useTheme } from "../../context/ThemeContext";

const NAV_ITEMS = [
  { name: "Home",    href: "/" },
  { name: "Watches", href: "/watches" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { totalItems, clearCart } = useCart();
  const { dark, toggle } = useTheme();
  const userMenuRef = useRef(null);

  const [user, setUser] = useState(() => {
    try { const r = localStorage.getItem("user"); return r ? JSON.parse(r) : null; }
    catch { return null; }
  });

  const loggedIn = !!(user || localStorage.getItem("authToken"));

  // Close user dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Sync user from storage
  useEffect(() => {
    const h = () => {
      try { const r = localStorage.getItem("user"); setUser(r ? JSON.parse(r) : null); }
      catch { setUser(null); }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  const handleLogout = () => {
    ["authToken","authtoken","user","isLoggedIn","cart","cartItems"].forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    try { clearCart?.(); } catch (_) {}
    setUser(null);
    setUserMenuOpen(false);
    navigate("/");
  };

  const isActive = (href) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // ── Reusable dark-toggle button ────────────────────────────────────────
  const DarkToggle = ({ className = "" }) => (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors
        hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
              <Clock size={16} className="text-white dark:text-slate-900" />
            </div>
            <span
              className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ChronoElite
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive(item.href)
                    ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">

            {/* Dark mode toggle */}
            <DarkToggle />

            {/* Cart */}
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* User menu — desktop */}
            {loggedIn ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? <User size={13} />}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                    {user?.name?.split(" ")[0] ?? "Account"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50">
                    {user && (
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>
                    )}
                    <Link
                      to="/my-orders"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package size={15} className="text-slate-400" /> My Orders
                    </Link>
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
              >
                <User size={14} /> Sign In
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Menu"
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-1 transition-colors">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {item.name}
            </Link>
          ))}

          <hr className="border-slate-100 dark:border-slate-800 my-2" />

          {/* Dark mode in mobile */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          <hr className="border-slate-100 dark:border-slate-800 my-1" />

          {loggedIn ? (
            <>
              {user && (
                <div className="px-4 py-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </div>
              )}
              <Link
                to="/my-orders"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Package size={15} /> My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 transition-colors"
            >
              <User size={14} /> Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}