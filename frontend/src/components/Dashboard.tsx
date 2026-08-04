import React, { useState, useEffect } from 'react';
import {
  Shirt, Calendar, Plus, X, Bot, Mic, Loader2, Sparkles, AlertCircle, Check, MapPin, ChevronRight, Home, Building, Plane, Trash2
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
  { value: 'going_home',  label: 'Going Home',       icon: <Home size={18} /> },
  { value: 'returning',   label: 'Returning to PG',  icon: <Building size={18} /> },
  { value: 'weekend',     label: 'Weekend Trip',     icon: <Plane size={18} /> },
  { value: 'other',       label: 'Other',            icon: <MapPin size={18} /> },
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

/* ════════════════════════════════════════
   ADD TRIP MODAL
════════════════════════════════════════ */
const AddTripModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (t: Trip) => void }) => {
  const [form, setForm] = useState({ type: 'going_home', date: '', status: 'Pending', note: '' });
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
      icon: selected.value === 'going_home' ? '🏠' : selected.value === 'returning' ? '🏢' : '✈️',
      date: form.date,
      status: form.status,
      note: form.note,
    };
    onAdd(newTrip);
    onClose();
  };

  return (
    <div className="premium-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="premium-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon"><Calendar size={20} /></div>
            <h2>Plan a Trip</h2>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Trip Type</label>
            <div className="trip-type-grid">
              {TRIP_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`type-btn ${form.type === t.value ? 'selected' : ''}`}
                  onClick={() => handleChange('type', t.value)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Travel Date</label>
            <input
              type="date"
              className="premium-input"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => handleChange('date', e.target.value)}
            />
            {error && <span style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 4 }}>{error}</span>}
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="status-row">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`status-btn ${form.status === s ? 'active' : ''}`}
                  onClick={() => handleChange('status', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <input
              type="text"
              className="premium-input"
              placeholder="e.g. Bring extra clothes..."
              value={form.note}
              onChange={e => handleChange('note', e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-submit" onClick={handleSubmit}>
              <Plus size={18} /> Add Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   DASHBOARD COMPONENT
════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [laundryStats, setLaundryStats] = useState({ clean: 0, dirty: 0 });
  const [trips, setTrips] = useState<Trip[]>([
    { id: 1, type: 'Going Home',      icon: '🏠', date: '2026-06-20', status: 'Pending',   note: '' },
    { id: 2, type: 'Returning to PG', icon: '🏢', date: '2026-06-22', status: 'Planned',   note: '' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:8001/laundry/stats/1');
        setLaundryStats(res.data);
      } catch (err) {
        // Fallback or handle error quietly
      }
    };
    fetchStats();
  }, []);

  const total = laundryStats.clean + laundryStats.dirty;
  const cleanPct = total === 0 ? 0 : (laundryStats.clean / total) * 100;
  const dirtyPct = total === 0 ? 0 : (laundryStats.dirty / total) * 100;
  const { text: greeting, emoji: greetEmoji } = getGreeting();

  const handleStartVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
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
    try {
      const res = await axios.post('http://localhost:8001/ai/quick-add', {
        prompt: aiPrompt,
        user_id: 1,
      });
      const newTrip: Trip = {
        id: res.data.trip.id,
        type: res.data.trip.trip_type,
        icon: res.data.trip.trip_type.includes('Home') ? '🏠' : res.data.trip.trip_type.includes('PG') ? '🏢' : '✈️',
        date: res.data.trip.trip_date.split('T')[0],
        status: res.data.trip.status,
        note: '✨ AI Auto-Planned',
      };
      setTrips(prev => [newTrip, ...prev]);
      setAiPrompt('');
    } catch (err) {
      alert(`AI Error: Could not connect to AI service.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="dashboard-premium-wrapper">
      {showModal && <AddTripModal onClose={() => setShowModal(false)} onAdd={t => setTrips([t, ...trips])} />}

      <div className="db-container">
        
        {/* ── Hero / Header ── */}
        <header className="db-header">
          <div className="db-date-pill">
            <span className="db-date-dot"></span>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="db-greeting">{greeting} {greetEmoji}</h1>
          <p className="db-subtitle">
            <Sparkles size={16} className="text-accent-primary" /> 
            Here's what's happening with your hostel essentials.
          </p>
        </header>

        {/* ── AI Input Bar ── */}
        <section className="db-ai-section">
          <form className="ai-input-bar" onSubmit={handleAISubmit}>
            <Bot size={20} color="var(--accent-primary)" />
            <input 
              type="text" 
              className="ai-input" 
              placeholder='Try "Going home this weekend, remind me to pack laptop"'
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              disabled={isAiLoading}
            />
            <button type="button" className={`ai-mic-btn ${isListening ? 'listening' : ''}`} onClick={handleStartVoice}>
              <Mic size={18} />
            </button>
            <button type="submit" className="ai-submit-btn" disabled={isAiLoading || !aiPrompt.trim()}>
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate
            </button>
          </form>
        </section>

        {/* ── Quick Actions ── */}
        <section className="db-grid-section">
          <h2 className="section-title"><Check size={20} className="section-icon" /> Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="glass-card action-card action-home" onClick={() => setShowModal(true)}>
              <div className="action-emoji">🏠</div>
              <div className="action-info">
                <h3>Going Home</h3>
                <p>Pack essentials & dirty clothes</p>
              </div>
              <ChevronRight size={20} className="action-arrow" />
            </div>
            
            <div className="glass-card action-card action-pg" onClick={() => setShowModal(true)}>
              <div className="action-emoji">🏢</div>
              <div className="action-info">
                <h3>Returning to PG</h3>
                <p>Don't forget clean clothes</p>
              </div>
              <ChevronRight size={20} className="action-arrow" />
            </div>
          </div>
        </section>

        {/* ── Laundry Overview ── */}
        <section className="laundry-section">
          <h2 className="section-title"><Shirt size={20} className="section-icon text-green" /> Laundry Status</h2>
          <div className="glass-card laundry-content">
            <div className="laundry-stats-grid">
              <div className="stat-box clean">
                <p className="stat-num">{laundryStats.clean}</p>
                <p className="stat-lbl">Clean Items</p>
              </div>
              <div className="stat-box dirty">
                <p className="stat-num">{laundryStats.dirty}</p>
                <p className="stat-lbl">To Wash</p>
              </div>
              <div className="stat-box">
                <p className="stat-num">{total}</p>
                <p className="stat-lbl">Total Items</p>
              </div>
            </div>
            
            <div className="laundry-bars">
              <div className="progress-group">
                <div className="progress-label clean"><span>Clean & Ready</span> <span>{cleanPct.toFixed(0)}%</span></div>
                <div className="progress-track">
                  <div className="progress-fill fill-green" style={{ width: `${cleanPct}%` }}></div>
                </div>
              </div>
              <div className="progress-group">
                <div className="progress-label dirty"><span>Dirty / Pending</span> <span>{dirtyPct.toFixed(0)}%</span></div>
                <div className="progress-track">
                  <div className="progress-fill fill-red" style={{ width: `${dirtyPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Upcoming Trips ── */}
        <section className="trips-section">
          <div className="trips-header">
            <h2 className="section-title" style={{ margin: 0 }}><Calendar size={20} className="section-icon" /> Upcoming Trips</h2>
            <span className="trips-count-badge">{trips.length} active</span>
          </div>
          
          <div className="glass-card" style={{ padding: trips.length === 0 ? '1.5rem' : '0.5rem' }}>
            {trips.length === 0 ? (
              <div className="empty-trips">
                <span className="empty-icon">🎒</span>
                <h3>No trips scheduled</h3>
                <p>Plan your next journey and keep track of your packing list.</p>
              </div>
            ) : (
              <div className="trips-list">
                {trips.map((trip) => (
                  <div key={trip.id} className="trip-item" onClick={() => navigate(`/trip-manager?trip_id=${trip.id}`)}>
                    <div className="trip-emoji-wrapper">{trip.icon}</div>
                    <div className="trip-details">
                      <h3 className="trip-title">{trip.type}</h3>
                      <p className="trip-date"><Calendar size={12} /> {formatDate(trip.date)}</p>
                      {trip.note && <p className="trip-note">{trip.note}</p>}
                    </div>
                    <span className={`trip-status status-${trip.status}`}>{trip.status}</span>
                    <button className="trip-delete-btn" onClick={(e) => { e.stopPropagation(); setTrips(trips.filter(t => t.id !== trip.id)); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button className="add-trip-btn-large" onClick={() => setShowModal(true)}>
            <div className="add-trip-icon"><Plus size={20} /></div>
            Add a new trip
          </button>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;