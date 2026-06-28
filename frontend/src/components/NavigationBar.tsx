import { Link, useLocation } from 'react-router-dom';
import { Backpack, LayoutDashboard, Navigation, Shirt, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const links = [
    { to: '/',               label: 'Dashboard',       Icon: LayoutDashboard },
    { to: '/trip-manager',   label: 'Plan Trip',        Icon: Navigation },
    { to: '/laundry-tracker',label: 'Laundry',          Icon: Shirt },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Backpack size={18} />
          </div>
          <span>Home Trip Mode</span>
        </Link>

        {/* Links */}
        <div className="navbar-links">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link ${location.pathname === to ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <span className={`theme-toggle-icon ${isDark ? 'icon-sun' : 'icon-moon'}`}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;