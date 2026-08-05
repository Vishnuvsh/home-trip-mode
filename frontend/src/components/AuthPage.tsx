import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Backpack, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

type Tab = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (tab === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
        setSuccess('Account created! Logging you in…');
        await new Promise(r => setTimeout(r, 800));
      }
      navigate('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail === 'Username already registered') {
        setError('That username is already taken. Try another.');
      } else if (detail === 'Incorrect username or password') {
        setError('Wrong username or password. Please try again.');
      } else {
        setError('Could not connect to server. Make sure the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card">
        {/* ── Left Brand Panel ── */}
        <div className="auth-brand-panel">
          <div className="auth-brand-glow" />
          <div className="auth-brand-glow-2" />

          <div className="auth-brand-top">
            <div className="auth-brand-logo">
              <Backpack size={26} color="#ffffff" />
            </div>
            <h1 className="auth-brand-title">Home Trip<br />Mode</h1>
            <p className="auth-brand-subtitle">
              Your smart hostel companion — track laundry, plan trips, and never forget essentials again.
            </p>
          </div>

          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <div className="auth-feature-emoji">🧺</div>
              <span className="auth-feature-text">Smart Laundry Tracker</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-emoji">🗺️</div>
              <span className="auth-feature-text">AI-Powered Trip Planner</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-emoji">✅</div>
              <span className="auth-feature-text">Auto Packing Checklists</span>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="auth-form-eyebrow">Welcome</span>
            <h2 className="auth-form-title">
              {tab === 'login' ? 'Sign in to continue' : 'Create your account'}
            </h2>
            <p className="auth-form-sub">
              {tab === 'login'
                ? "Don't have an account? Switch to Register below."
                : 'Already registered? Switch to Login below.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
              type="button"
              id="auth-tab-login"
            >
              Login
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
              type="button"
              id="auth-tab-register"
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="auth-input-wrap">
              <input
                id="auth-username"
                type="text"
                className="auth-input"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                autoFocus
              />
              <User size={17} className="auth-input-icon" />
            </div>

            {/* Password */}
            <div className="auth-input-wrap">
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                disabled={isLoading}
              />
              <Lock size={17} className="auth-input-icon" />
            </div>

            {/* Confirm Password (register only) */}
            {tab === 'register' && (
              <div className="auth-input-wrap">
                <input
                  id="auth-confirm-password"
                  type="password"
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <Lock size={17} className="auth-input-icon" />
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="auth-alert auth-alert-success">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              id="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
