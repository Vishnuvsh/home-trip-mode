import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Backpack, LayoutDashboard, Navigation, Shirt, Sun, Moon, Power, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { username, logout } = useAuth();

  // Live iPhone Clock
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date like iPhone lockscreen: "Sunday, October 5"
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Format time like iPhone lockscreen: "9:35"
  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const hour12 = hours % 12 || 12;
  const timeStr = `${hour12}:${minutes}`;

  const links = [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/trip-manager', label: 'Plan Trip', Icon: Navigation },
    { to: '/laundry-tracker', label: 'Laundry', Icon: Shirt },
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
          {/* ── iPhone Lockscreen Style Clock ── */}
          <div className="navbar-iphone-clock" title={`${dateStr} ${timeStr}`}>
            <span className="iphone-clock-date">{dateStr}</span>
            <span className="iphone-clock-time">{timeStr}</span>
          </div>

          {/* Divider removed — items grouped tight */}

          {/* User chip */}
          {username && (
            <div className="navbar-user-chip">
              <div className="user-avatar-placeholder">
                <User size={14} strokeWidth={2.5} />
              </div>
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
            <Power size={16} strokeWidth={2.5} className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default NavigationBar;