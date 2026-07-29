import React, { useState, useEffect } from 'react';
import {
  Shirt, AlertCircle,
  Calendar, ChevronRight, Plus, X, Check, WifiOff,
  Sparkles, Trash2, Mic, Loader2, Bot
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

/* ── Types ── */
interface Trip {
  id: number;
  type: string;
  icon: string;
  date: string;
  status: string;
  note: string;
}

interface AddTripModalProps {
  onClose: () => void;
  onAdd: (trip: Trip) => void;
}

interface AIResponseData {
  trip: {
    id: number;
    trip_type: string;
    trip_date: string;
    status: string;
  };
  detected_type: string;
  detected_date_str: string;
  extracted_items: string[];
  ai_summary: string;
}

/* ── Constants ── */
const TRIP_TYPES = [
  { value: 'going_home',  label: 'Going Home',       icon: '🏠', color: 'amber' },
  { value: 'returning',   label: 'Returning to PG',  icon: '🏢', color: 'indigo' },
  { value: 'weekend',     label: 'Weekend Trip',     icon: '🌄', color: 'green' },
  { value: 'other',       label: 'Other',            icon: '📍', color: 'red' },
];

const STATUS_OPTIONS = ['Pending', 'Planned', 'Completed', 'Cancelled'];

/* ── Helpers ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

/* ── Status Badge ── */
const TripStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; dot: string }> = {
    Pending:   { cls: 'badge-amber',  dot: '🟡' },
    Planned:   { cls: 'badge-indigo', dot: '🔵' },
    Completed: { cls: 'badge-green',  dot: '🟢' },
    Cancelled: { cls: 'badge-red',    dot: '🔴' },
  };
  const { cls } = map[status] || map.Pending;
  return <span className={`status-badge ${cls}`}>{status}</span>;
};

/* ════════════════════════════════════════
   ADD TRIP MODAL
════════════════════════════════════════ */
const AddTripModal: React.FC<AddTripModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ type: 'going_home', date: '', status: 'Pending', note: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!form.date) { setError('Please pick a travel date.'); return; }
    const selected = TRIP_TYPES.find(t => t.value === form.type) || TRIP_TYPES[0];
    const newTrip: Trip = {
      id: Date.now(),
      type: selected.label,
      icon: selected.icon,
      date: form.date,
      status: form.status,
      note: form.note,
    };
    setSubmitted(true);
    setTimeout(() => { onAdd(newTrip); onClose(); }, 1000);
  };

  /* click-outside to close */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-pill"><Calendar size={18} /></div>
            <h2 className="modal-title">Add a Trip ✈️</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* ── Success ── */
          <div className="modal-success">
            <div className="success-circle">
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <p className="success-title">Trip added! 🎉</p>
            <p className="success-sub">Your packing list is ready.</p>
          </div>
        ) : (
          <div className="modal-body">

            {/* Trip Type */}
            <div className="form-group">
              <label className="form-label">Where are you going?</label>
              <div className="trip-type-grid">
                {TRIP_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`trip-type-btn trip-type-${t.color} ${form.type === t.value ? 'selected' : ''}`}
                    onClick={() => handleChange('type', t.value)}
                  >
                    <span className="trip-type-emoji">{t.icon}</span>
                    <span className="trip-type-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="trip-date">📅 Travel Date</label>
              <input
                id="trip-date"
                type="date"
                className="form-input"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => handleChange('date', e.target.value)}
              />
              {error && (
                <p className="form-error"><AlertCircle size={13} /> {error}</p>
              )}
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="status-pill-row">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`status-pill ${form.status === s ? `status-pill-active status-${s.toLowerCase()}` : ''}`}
                    onClick={() => handleChange('status', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label" htmlFor="trip-note">
                📝 Note <span className="optional-tag">optional</span>
              </label>
              <textarea
                id="trip-note"
                className="form-input form-textarea"
                placeholder="e.g. Carry extra clothes, collect fees..."
                value={form.note}
                onChange={e => handleChange('note', e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-add" onClick={handleSubmit} id="confirm-add-trip">
                <Plus size={18} /> Add Trip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   AI INSIGHT RESULT MODAL
════════════════════════════════════════ */
const AIResultModal = ({ data, onClose }: { data: AIResponseData; onClose: () => void }) => {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
        <div className="ai-modal-header">
          <div className="modal-icon-pill" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <Bot size={20} />
          </div>
          <div>
            <span className="ai-modal-badge">✨ AI Smart Quick-Add</span>
            <h2 className="modal-title" style={{ marginTop: 4 }}>Trip Auto-Planned!</h2>
          </div>
          <button className="modal-close-btn" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--text)', fontWeight: 500, margin: '0 0 12px' }}>
            {data.ai_summary}
          </p>

          <div className="ai-insight-box">
            <div className="ai-insight-row">
              <span className="ai-insight-label">🏷️ Trip Type</span>
              <span className="ai-insight-val">{data.detected_type}</span>
            </div>
            <div className="ai-insight-row">
              <span className="ai-insight-label">📅 Travel Date</span>
              <span className="ai-insight-val">{data.detected_date_str}</span>
            </div>
            <div className="ai-insight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span className="ai-insight-label">🎒 Added to Checklist ({data.extracted_items.length} items)</span>
              <div className="ai-items-tags">
                {data.extracted_items.map((item, idx) => (
                  <span key={idx} className="ai-item-tag">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button className="btn-add" style={{ width: '100%', justifyContent: 'center' }} id="close-ai-modal-btn" onClick={onClose}>
              <Check size={18} /> Got it! View Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [laundryStats, setLaundryStats] = useState({ clean: 0, dirty: 0 });
  const [trips, setTrips] = useState<Trip[]>([
    { id: 1, type: 'Going Home',      icon: '🏠', date: '2026-06-20', status: 'Pending',   note: '' },
    { id: 2, type: 'Returning to PG', icon: '🏢', date: '2026-06-22', status: 'Planned',   note: '' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  /* ── AI Quick-Add State ── */
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponseData | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleStartVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge!');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ml-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAISubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    setApiError(null);
    try {
      const res = await axios.post('http://localhost:8001/ai/quick-add', {
        prompt: aiPrompt,
        user_id: 1,
      });
      setAiResult(res.data);
      const newTrip: Trip = {
        id: res.data.trip.id,
        type: res.data.trip.trip_type,
        icon: res.data.trip.trip_type === 'Going Home' ? '🏠' : res.data.trip.trip_type === 'Returning to PG' ? '🏢' : '✈️',
        date: res.data.trip.trip_date.split('T')[0],
        status: res.data.trip.status,
        note: '✨ AI Auto-Planned',
      };
      setTrips(prev => [newTrip, ...prev]);
      setAiPrompt('');
    } catch (err: any) {
      alert(`AI Error: ${err.response?.data?.detail || err.message || "Failed to connect to backend. Is Uvicorn running?"}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); setApiError(null);
      try {
        const res = await axios.get('http://localhost:8001/laundry/stats/1');
        setLaundryStats(res.data);
      } catch {
        setApiError('Backend offline — showing demo data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddTrip    = (t: Trip)    => setTrips(prev => [t, ...prev]);
  const handleDeleteTrip = (id: number) => setTrips(prev => prev.filter(t => t.id !== id));

  const total    = laundryStats.clean + laundryStats.dirty;
  const cleanPct = total === 0 ? 0 : Math.round((laundryStats.clean / total) * 100);
  const dirtyPct = total === 0 ? 0 : Math.round((laundryStats.dirty / total) * 100);

  const { text: greeting, emoji: greetEmoji } = getGreeting();

  return (
    <>
      {showModal && (
        <AddTripModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTrip}
        />
      )}

      {aiResult && (
        <AIResultModal
          data={aiResult}
          onClose={() => setAiResult(null)}
        />
      )}

      <div className="db-page">

        {/* ── Ambient background orbs ── */}
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />

        {/* ═══════════════ HERO ═══════════════ */}
        <div className="db-hero">
          <div className="db-hero-dots" />
          <div className="db-hero-content">
            <p className="db-date-label">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <h1 className="db-greeting">
              {greeting} {greetEmoji}
            </h1>
            <p className="db-subtitle">
              <Sparkles size={14} className="db-subtitle-icon" />
              Your hostel essentials, at a glance.
            </p>
          </div>
          <div className="db-hero-bubble db-hero-bubble-1" />
          <div className="db-hero-bubble db-hero-bubble-2" />
        </div>

        {/* ═══════════════ BODY ═══════════════ */}
        <div className="db-body">

          {/* ── AI Smart Quick-Add Bar ── */}
          <section className="db-ai-section">
            <form onSubmit={handleAISubmit} className="db-ai-box">
              <div className="db-ai-icon-wrap" title="AI Assistant Active">
                <Bot size={20} />
              </div>
              <input
                type="text"
                className="db-ai-input"
                placeholder='🎙️ സംസാരിച്ചാലോ ടൈപ്പ് ചെയ്താലോ മതി! (ഉദാ: "ഈ വെള്ളിയാഴ്ച വീട്ടിൽ പോകണം, ലാപ്ടോപ്പും ജാക്കറ്റും എടുക്കാൻ മറക്കരുത്")'
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={isAiLoading}
                id="ai-quick-add-input"
              />
              <button
                type="button"
                className={`db-ai-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={handleStartVoice}
                title={isListening ? 'സംസാരിച്ചോളൂ... (Listening...)' : 'വോയ്സ് ഇൻപുട്ട് (Voice Input)'}
                aria-label="Start voice input"
              >
                <Mic size={18} />
              </button>
              <button
                type="submit"
                className="db-ai-submit-btn"
                disabled={isAiLoading || !aiPrompt.trim()}
                id="ai-quick-add-submit"
              >
                {isAiLoading ? (
                  <><Loader2 size={16} className="tm-spinner" /> അനലൈസ് ചെയ്യുന്നു...</>
                ) : (
                  <><Sparkles size={16} /> AI Add</>
                )}
              </button>
            </form>
          </section>

          {/* API offline notice */}
          {apiError && (
            <div className="db-alert">
              <WifiOff size={16} />
              {apiError}
            </div>
          )}

          {/* ── Quick-Action Cards ── */}
          <section className="db-section">
            <h2 className="db-section-title">
              <span className="db-section-dot" />
              Quick Actions
            </h2>

            <div className="db-actions-grid">
              {/* Going Home */}
              <div className="db-action-card db-action-amber">
                <div className="db-action-emoji">🏠</div>
                <div className="db-action-body">
                  <p className="db-action-title">Going Home</p>
                  <p className="db-action-hint">Pack essentials &amp; laundry</p>
                </div>
                <div className="db-action-arrow">
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Returning */}
              <div className="db-action-card db-action-indigo">
                <div className="db-action-emoji">🏢</div>
                <div className="db-action-body">
                  <p className="db-action-title">Returning to PG</p>
                  <p className="db-action-hint">Don't forget clean clothes</p>
                </div>
                <div className="db-action-arrow">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Laundry Stats ── */}
          <section className="db-section">
            <h2 className="db-section-title">
              <span className="db-section-dot db-section-dot-green" />
              Laundry Overview
            </h2>

            <div className="db-laundry-card">
              <div className="db-laundry-icon-wrap">
                <Shirt size={22} className="db-laundry-icon" />
                {isLoading && <span className="db-loading-pulse" />}
              </div>

              <div className="db-laundry-stats">
                {/* Clean */}
                <div className="db-laundry-stat">
                  <div className="db-laundry-stat-top">
                    <span className="db-laundry-label">✅ Clean</span>
                    <span className="db-laundry-count db-count-green">
                      {laundryStats.clean}
                    </span>
                  </div>
                  <div className="db-progress-track">
                    <div
                      className="db-progress-fill db-fill-green"
                      style={{ width: `${cleanPct}%` }}
                    />
                  </div>
                </div>

                {/* Dirty */}
                <div className="db-laundry-stat">
                  <div className="db-laundry-stat-top">
                    <span className="db-laundry-label">🧺 Dirty</span>
                    <span className="db-laundry-count db-count-red">
                      {laundryStats.dirty}
                    </span>
                  </div>
                  <div className="db-progress-track">
                    <div
                      className="db-progress-fill db-fill-red"
                      style={{ width: `${dirtyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat pills */}
              <div className="db-laundry-pills">
                <div className="db-stat-pill db-pill-green">
                  <p className="db-pill-num">{laundryStats.clean}</p>
                  <p className="db-pill-lbl">Ready</p>
                </div>
                <div className="db-stat-pill db-pill-red">
                  <p className="db-pill-num">{laundryStats.dirty}</p>
                  <p className="db-pill-lbl">Need wash</p>
                </div>
                <div className="db-stat-pill db-pill-neutral">
                  <p className="db-pill-num">{total}</p>
                  <p className="db-pill-lbl">Total</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Upcoming Trips ── */}
          <section className="db-section">
            <div className="db-section-header">
              <h2 className="db-section-title" style={{ margin: 0 }}>
                <span className="db-section-dot db-section-dot-amber" />
                Upcoming Trips
              </h2>
              <span className="db-trip-count">{trips.length}</span>
            </div>

            <div className="db-trips-card">
              {trips.length === 0 ? (
                <div className="db-trips-empty">
                  <span className="db-trips-empty-icon">🗺️</span>
                  <p className="db-trips-empty-msg">No trips planned yet.</p>
                  <p className="db-trips-empty-sub">Tap "Add a trip" to get started!</p>
                </div>
              ) : (
                <div className="db-trips-list">
                  {trips.map((trip, idx) => (
                    <div
                      key={trip.id}
                      className="db-trip-item"
                      style={{ animationDelay: `${idx * 60}ms`, cursor: 'pointer' }}
                      onClick={() => navigate(`/trip-manager?trip_id=${trip.id}`)}
                    >
                      <div className="db-trip-emoji-wrap">
                        <span className="db-trip-emoji">{trip.icon}</span>
                      </div>
                      <div className="db-trip-info">
                        <p className="db-trip-name">{trip.type}</p>
                        <p className="db-trip-date">
                          <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {formatDate(trip.date)}
                        </p>
                        {trip.note && <p className="db-trip-note">{trip.note}</p>}
                      </div>
                      <TripStatusBadge status={trip.status} />
                      <button
                        className="db-trip-delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }}
                        aria-label="Delete trip"
                        title="Remove trip"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add trip button */}
            <button
              className="db-add-btn"
              onClick={() => setShowModal(true)}
              id="add-trip-btn"
            >
              <div className="db-add-btn-icon"><Plus size={20} /></div>
              <span>Add a trip</span>
            </button>
          </section>

        </div>
      </div>
    </>
  );
};

export default Dashboard;