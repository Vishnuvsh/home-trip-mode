import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Navigation,
  Shirt,
  Power,
  User,
  Menu,
  X,
  Sparkles,
  Download,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Clock & Date state
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // PWA Install Prompt Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Format date like iOS: "Sun, Sep 6"
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Format time: "9:42 AM"
  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const links = [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/trip-manager', label: 'Plan Trip', Icon: Navigation },
    { to: '/laundry-tracker', label: 'Laundry Tracker', Icon: Shirt },
    { to: '/docs', label: 'Guide', Icon: BookOpen },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isDashboard = location.pathname === '/';
  const navLayoutClass = isDashboard ? 'nav-horizontal' : 'nav-vertical';

  return (
    <header className={`nav-header-wrapper ${navLayoutClass}`}>
      <nav className="nav-island" aria-label="Main Navigation">
        {/* ── AMBIENT TOP GLOW LINE ── */}
        <div className="nav-glow-accent" aria-hidden="true" />

        <div className="nav-inner">
          {/* ── LEFT: Brand Logo & Title ── */}
          <Link to="/" className="nav-brand" aria-label="Home Trip Mode Home">
            <div className="nav-brand-badge">
              <Home className="nav-brand-icon" size={18} strokeWidth={2.4} />
              <span className="nav-brand-ping" />
            </div>
            <div className="nav-brand-text-wrap">
              <span className="nav-brand-title">Home Trip Mode</span>
              <span className="nav-brand-pill">
                <Sparkles size={9} /> TRAVEL HUB
              </span>
            </div>
          </Link>

          {/* ── CENTER: Segmented Pill Menu (Desktop) ── */}
          <div className="nav-center-menu">
            <div className="nav-segmented-track" role="tablist">
              {links.map(({ to, label, Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    role="tab"
                    aria-selected={isActive}
                    className={`nav-pill-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.4 : 1.9} className="nav-pill-icon" />
                    <span className="nav-pill-label">{label}</span>
                    {isActive && <span className="nav-pill-active-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Status Widget (Clock, User, Theme, Logout) ── */}
          <div className="nav-right-widget">
            {/* Live iOS Lockscreen Clock */}
            <div className="nav-clock-widget" title={`${dateStr} • ${timeStr}`}>
              <span className="nav-clock-date">{dateStr}</span>
              <span className="nav-clock-time">{timeStr}</span>
            </div>

            {/* User Profile Pill */}
            {username && (
              <div className="nav-user-pill" title={`Logged in as ${username}`}>
                <div className="nav-user-avatar-wrap">
                  <div className="nav-user-avatar">
                    <User size={14} strokeWidth={2.5} />
                  </div>
                  <span className="nav-user-status-dot" />
                </div>
                <span className="nav-user-name">{username}</span>
              </div>
            )}

            {/* Install App Button */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                title="Install App to Home Screen"
                style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', boxShadow: '0 4px 12px var(--accent-glow)' }}
              >
                <Download size={14} strokeWidth={2.5} /> Install
              </button>
            )}

            {/* Logout Action */}
            <button
              type="button"
              className="nav-logout-action"
              onClick={handleLogout}
              title="Log out of session"
              id="navbar-logout-btn"
            >
              <Power size={15} strokeWidth={2.3} className="logout-icon" />
              <span className="logout-text">Logout</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className={`nav-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── MOBILE COLLAPSIBLE DRAWER ── */}
        {mobileMenuOpen && (
          <div className="nav-mobile-drawer">
            <div className="nav-mobile-links">
              {links.map(({ to, label, Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`nav-mobile-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                    <span>{label}</span>
                    {isActive && <span className="nav-mobile-badge">Active</span>}
                  </Link>
                );
              })}
            </div>

            <div className="nav-mobile-footer">
              <div className="nav-mobile-clock">
                <span>{dateStr}</span>
                <strong>{timeStr}</strong>
              </div>

              {username && (
                <div className="nav-mobile-user">
                  <User size={14} />
                  <span>{username}</span>
                </div>
              )}

              <div className="nav-mobile-actions">
                {isInstallable && (
                  <button
                    type="button"
                    className="nav-mobile-logout-btn"
                    onClick={handleInstallClick}
                    style={{ background: 'var(--accent)', color: '#000', border: 'none', marginRight: '8px' }}
                  >
                    <Download size={16} />
                    <span>Install App</span>
                  </button>
                )}

                <button
                  type="button"
                  className="nav-mobile-logout-btn"
                  onClick={handleLogout}
                >
                  <Power size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavigationBar;