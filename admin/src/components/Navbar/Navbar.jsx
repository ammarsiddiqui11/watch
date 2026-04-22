// src/components/Navbar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  X,
  PlusCircle,
  List as ListIcon,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { navbarStyles } from "../../assets/dummyStyles";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const NavItem = ({ to, Icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${navbarStyles.navItemBase} ` +
        (isActive
          ? navbarStyles.navItemActive
          : navbarStyles.navItemInactive)
      }
      onClick={() => setOpen(false)}
    >
      {Icon && <Icon className={navbarStyles.navItemIcon} />}
      <span>{children}</span>
    </NavLink>
  );

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        {/* Main rounded bar */}
        <div className={navbarStyles.mainBar}>
          {/* Left: Brand */}
          <div className={navbarStyles.brandContainer}>
            <div className={navbarStyles.brandLogo}>
              <Clock className={navbarStyles.brandIcon} />
            </div>
            <NavLink
              to="/add"
              className={navbarStyles.brandText}
              style={{
                fontFamily:
                  'Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
              }}
            >
              ChronoLite
            </NavLink>
          </div>

          {/* Center: nav options (centered) */}
          <nav className={navbarStyles.navContainer}>
            <div className={navbarStyles.navItemsContainer}>
              <NavItem to="/add" Icon={PlusCircle}>
                Add
              </NavItem>
              <NavItem to="/list" Icon={ListIcon}>
                List
              </NavItem>
              <NavItem to="/booking" Icon={CalendarCheck}>
                Manage Bookings
              </NavItem>
            </div>
          </nav>

          {/* Right: search + mobile toggle */}
          <div className={navbarStyles.rightContainer}>
            {/* mobile menu button */}
            <button
              className={navbarStyles.mobileMenuButton}
              onClick={() => setOpen(!open)}
              aria-label="menu"
            >
              {open ? (
                <X className={navbarStyles.mobileMenuIcon} />
              ) : (
                <Menu className={navbarStyles.mobileMenuIcon} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown (centered items) */}
        {open && (
          <div className={navbarStyles.mobileDropdown}>
            <div className={navbarStyles.mobileNavItemsContainer}>
              <NavItem to="/add" Icon={PlusCircle}>
                Add
              </NavItem>
              <NavItem to="/list" Icon={ListIcon}>
                List
              </NavItem>
              <NavItem to="/booking" Icon={CalendarCheck}>
                Manage Bookings
              </NavItem>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}