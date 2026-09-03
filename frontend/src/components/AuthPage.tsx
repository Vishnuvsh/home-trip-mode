import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Backpack, Loader2, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

type Tab = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { persistAuth } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Post-login animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStage, setAnimStage] = useState<number>(0); // 0: verified, 1: syncing, 2: ready, 3: exiting
  const [animUser, setAnimUser] = useState('');
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);

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
      let token = '';
      let uid = 0;
      const cleanUser = username.trim();

      if (tab === 'login') {
        const res = await api.post(`/auth/login`, { username: cleanUser, password });
        token = res.data.access_token;
        const payload = JSON.parse(atob(token.split('.')[1]));
        uid = payload.user_id;
      } else {
        const res = await api.post(`/auth/register`, { username: cleanUser, password });
        uid = res.data.id;
        const loginRes = await api.post(`/auth/login`, { username: cleanUser, password });
        token = loginRes.data.access_token;
      }

      // Successful authentication! Trigger the transition animation sequence
      setIsLoading(false);
      setAnimUser(cleanUser);
      setIsRegisterSuccess(tab === 'register');
      setIsAnimating(true);
      setAnimStage(0);

      // Smooth staged animation timeline
      setTimeout(() => setAnimStage(1), 550);
      setTimeout(() => setAnimStage(2), 1150);
      setTimeout(() => setAnimStage(3), 1600); // Trigger exit fade/zoom

      // Complete transition into Dashboard
      setTimeout(() => {
        persistAuth(token, uid, cleanUser);
        navigate('/');
      }, 1950);

    } catch (err: any) {
      setIsLoading(false);
      const detail = err?.response?.data?.detail;
      if (detail === 'Username already registered') {
        setError('That username is already taken. Try another.');
      } else if (detail === 'Incorrect username or password') {
        setError('Wrong username or password. Please try again.');
      } else {
        setError('Could not connect to server. Make sure the backend is running.');
      }
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

      {/* ── Post-Login Transition Animation Overlay ── */}
      {isAnimating && (
        <div className={`auth-success-overlay ${animStage === 3 ? 'auth-success-exiting' : ''}`}>
          <div className="auth-success-mesh" />
          <div className="auth-success-orb auth-orb-glow-1" />
          <div className="auth-success-orb auth-orb-glow-2" />

          <div className="auth-success-card">
            {/* Pulsing Concentric Rings & Checkmark */}
            <div className="auth-pulse-ring-wrap">
              <div className="auth-pulse-ring ring-1" />
              <div className="auth-pulse-ring ring-2" />
              <div className="auth-pulse-ring ring-3" />
              
              <div className="auth-success-icon-badge">
                <svg className="auth-checkmark-svg" viewBox="0 0 52 52">
                  <circle className="auth-checkmark-circle" cx="26" cy="26" r="23" fill="none" />
                  <path className="auth-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
                <div className="auth-icon-glow" />
              </div>
            </div>

            {/* Typography & Greeting */}
            <div className="auth-success-text-wrap">
              <div className="auth-success-badge-pill">
                <Sparkles size={14} className="auth-sparkle-spin" />
                <span>{isRegisterSuccess ? 'Account Created' : 'Access Granted'}</span>
              </div>
              <h2 className="auth-success-title">
                {isRegisterSuccess ? 'Welcome aboard, ' : 'Welcome back, '}
                <span className="auth-success-name">{animUser}</span>!
              </h2>
              <p className="auth-success-subtitle">
                {animStage === 0 && 'Verifying credentials and security session...'}
                {animStage === 1 && 'Syncing your packing lists, wardrobe & trips...'}
                {(animStage === 2 || animStage === 3) && 'Ready! Launching Home Trip Mode...'}
              </p>
            </div>

            {/* Futuristic Progress Track */}
            <div className="auth-progress-section">
              <div className="auth-progress-track">
                <div
                  className="auth-progress-fill"
                  style={{
                    width: animStage === 0 ? '38%' : animStage === 1 ? '78%' : '100%'
                  }}
                >
                  <div className="auth-progress-glow-tip" />
                </div>
              </div>
              <div className="auth-progress-status-row">
                <span className="auth-progress-step">
                  {animStage === 0 && 'Phase 1: Authenticated'}
                  {animStage === 1 && 'Phase 2: Loading Workspace'}
                  {(animStage === 2 || animStage === 3) && 'Phase 3: Launching'}
                </span>
                <span className="auth-progress-pct">
                  {animStage === 0 && '38%'}
                  {animStage === 1 && '78%'}
                  {(animStage === 2 || animStage === 3) && '100%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
