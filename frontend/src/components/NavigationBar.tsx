import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Backpack, LayoutDashboard, Navigation, Shirt, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { username, logout } = useAuth();

  // Live Clock
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const links = [
    { to: '/',                label: 'Dashboard',  Icon: LayoutDashboard },
    { to: '/trip-manager',    label: 'Plan Trip',  Icon: Navigation },
    { to: '/laundry-tracker', label: 'Laundry',    Icon: Shirt },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── LEFT: Brand ── */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Backpack size={18} />
          </div>
          <span>Home Trip Mode</span>
        </Link>

        {/* ── CENTER: Nav Links ── */}
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

        {/* ── RIGHT: Clock + User + Theme + Logout ── */}
        <div className="navbar-right">
          {/* Live Clock */}
          <div className="navbar-clock">
            <span className="navbar-clock-pulse" />
            <div className="navbar-clock-body">
              <span className="navbar-clock-time">{timeStr}</span>
              <span className="navbar-clock-date">{dateStr}</span>
            </div>
          </div>

          {/* Divider removed — items grouped tight */}

          {/* User chip */}
          {username && (
            <div className="navbar-user-chip">
              <User size={13} />
              <span>{username}</span>
            </div>
          )}

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

          {/* Logout */}
          <button
            className="navbar-logout-btn"
            onClick={handleLogout}
            title="Logout"
            id="navbar-logout-btn"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default NavigationBar;