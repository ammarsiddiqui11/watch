// Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock, BaggageClaim, User, Menu, X } from "lucide-react";
import { useCart } from "../../CartContext";
import { navbarStyles } from "../../assets/dummyStyles";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Watches", href: "/watches" },
  { name: "Contact", href: "/contact" },
  { name: "My Orders", href: "/my-orders" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(location.pathname || "/");
  const { totalItems, clearCart, reloadCart } = useCart();

  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return (
        localStorage.getItem("isLoggedIn") === "true" ||
        !!localStorage.getItem("authToken")
      );
    } catch {
      return false;
    }
  });

  useEffect(() => setActive(location.pathname || "/"), [location]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "isLoggedIn" || e.key === "authToken") {
        try {
          const isNowLoggedIn =
            localStorage.getItem("isLoggedIn") === "true" ||
            !!localStorage.getItem("authToken");

          setLoggedIn(isNowLoggedIn);
        } catch {
          setLoggedIn(false);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loggedIn]);

  useEffect(() => {
    // Load cart on mount and whenever loggedIn becomes true
    try {
      reloadCart();
    } catch (e) {
      // ignore
    }
    // run once on mount and when loggedIn changes
  }, [loggedIn]);

  const handleNavClick = (href) => {
    setActive(href);
    setOpen(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authToken");
      localStorage.removeItem("authtoken");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");
    } catch (e) {}
    // ensure cart is emptied in memory/context
    try {
      clearCart && clearCart();
    } catch (e) {}
    setLoggedIn(false);
    setOpen(false);
    navigate("/");
  };

  return (
    <header className={navbarStyles.header}>
      <nav
        className={navbarStyles.nav}
        role="navigation"
        aria-label="Main"
      >
        <div className={navbarStyles.container}>
          <div className={navbarStyles.brandContainer}>
            <div className={navbarStyles.logoContainer}>
              <Clock className={navbarStyles.logoIcon} />
            </div>
            <Link
              to="/"
              onClick={() => handleNavClick("/")}
              className={navbarStyles.logoLink}
            >
              <span
                className={navbarStyles.logoText}
                style={navbarStyles.logoTextStyle}
              >
                ChronoElite
              </span>
            </Link>
          </div>

          <div className={navbarStyles.desktopNav}>
            {navItems.map((item) => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`${navbarStyles.navItemBase} ${
                    isActive
                      ? navbarStyles.navItemActive
                      : navbarStyles.navItemInactive
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{item.name}</span>
                  <span
                    aria-hidden="true"
                    className={`${navbarStyles.activeIndicator} ${
                      isActive
                        ? navbarStyles.activeIndicatorVisible
                        : navbarStyles.activeIndicatorHidden
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          <div className={navbarStyles.rightActions}>
            <Link
              to="/cart"
              aria-label="Cart"
              className={navbarStyles.cartLink}
            >
              <BaggageClaim className={navbarStyles.cartIcon} />
              {totalItems > 0 && (
                <span
                  className={navbarStyles.cartBadge}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {!loggedIn ? (
              <Link
                to="/login"
                className={navbarStyles.accountLink}
              >
                <User className={navbarStyles.accountIcon} />
                <span className={navbarStyles.accountText}>Account</span>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className={navbarStyles.accountLink}
                aria-label="Logout"
              >
                <User className={navbarStyles.accountIcon} />
                <span className={navbarStyles.accountText}>Logout</span>
              </button>
            )}

            <div className={navbarStyles.mobileMenuButton}>
              <button
                onClick={() => setOpen(!open)}
                aria-label="Open menu"
                aria-expanded={open}
                className={navbarStyles.menuButton}
              >
                {open ? (
                  <X className={navbarStyles.menuIcon} />
                ) : (
                  <Menu className={navbarStyles.menuIcon} />
                )}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className={navbarStyles.mobileMenu}>
            <div className={navbarStyles.mobileMenuContainer}>
              {navItems.map((item) => {
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`${navbarStyles.mobileNavItemBase} ${
                      isActive
                        ? navbarStyles.mobileNavItemActive
                        : navbarStyles.mobileNavItemInactive
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={navbarStyles.mobileNavItemText}>{item.name}</span>
                  </Link>
                );
              })}

              <div className={navbarStyles.mobileAccountContainer}>
                {!loggedIn ? (
                  <Link
                    to="/login"
                    onClick={() => {
                      setOpen(false);
                      handleNavClick("/login");
                    }}
                    className={navbarStyles.mobileAccountLink}
                  >
                    <User className={navbarStyles.mobileAccountIcon} />
                    <span>Account</span>
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className={navbarStyles.mobileAccountButton}
                  >
                    <User className={navbarStyles.mobileAccountIcon} />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}