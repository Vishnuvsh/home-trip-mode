import React, { useState, useEffect } from 'react';
import {
  Shirt, Calendar, Plus, X, Bot, Mic, Loader2, Sparkles, Check, Home, Building, Plane, Trash2, Droplets, Wind
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/* ── Types ── */
interface Trip {
  id: number;
  trip_type: string;
  trip_date: string;
  status: string;
}

/* ── Constants ── */
const TRIP_TYPES = [
  { value: 'Going Home',      label: 'Going Home',       icon: <Home size={18} /> },
  { value: 'Returning to PG', label: 'Returning to PG',  icon: <Building size={18} /> },
  { value: 'Weekend Trip',    label: 'Weekend Trip',     icon: <Plane size={18} /> },
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
const AddTripModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: () => void }) => {
  const [form, setForm] = useState({ type: 'Going Home', date: '', status: 'Pending' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!form.date) { setError('Please pick a travel date.'); return; }
    setIsSubmitting(true);
    try {
      await axios.post(`http://localhost:8001/trips/?user_id=${userId}`, {
        trip_type: form.type,
        trip_date: form.date,
        status: form.status,
      });
      onAdd();
      onClose();
    } catch {
      setError('Could not save trip. Make sure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-header">
          <div className="db-card-title-wrap">
            <div className="db-icon-box db-icon-box-accent"><Calendar size={20} /></div>
            <h2 className="db-card-title" style={{ fontSize: '18px', margin: 0 }}>Plan a Trip</h2>
          </div>
          <button className="db-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="db-modal-body">
          <div className="db-form-group">
            <label>Trip Type</label>
            <div className="db-type-grid">
              {TRIP_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`db-type-btn ${form.type === t.value ? 'selected' : ''}`}
                  onClick={() => handleChange('type', t.value)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="db-form-group">
            <label>Travel Date</label>
            <input
              type="date"
              className="db-premium-input"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => handleChange('date', e.target.value)}
            />
            {error && <span style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px' }}>{error}</span>}
          </div>

          <div className="db-form-group">
            <label>Status</label>
            <div className="db-status-row">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`db-status-btn ${form.status === s ? 'active' : ''}`}
                  onClick={() => handleChange('status', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="db-modal-actions">
            <button className="db-btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button className="db-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add Trip
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
  const { userId } = useAuth();
  const [laundryStats, setLaundryStats] = useState({ clean: 0, dirty: 0 });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`http://localhost:8001/laundry/stats/${userId}`);
      setLaundryStats(res.data);
    } catch {
      // Handle silently
    }
  };

  const fetchTrips = async () => {
    try {
      const res = await axios.get(`http://localhost:8001/trips/user/${userId}`);
      setTrips(res.data);
    } catch (err) {
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchStats();
  }, []);

  const total = laundryStats.clean + laundryStats.dirty;
  const cleanPct = total === 0 ? 0 : Math.round((laundryStats.clean / total) * 100);
  const dirtyPct = total === 0 ? 0 : Math.round((laundryStats.dirty / total) * 100);
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
      await axios.post('http://localhost:8001/ai/quick-add', { prompt: aiPrompt, user_id: userId });
      await fetchTrips();
      await fetchStats();
      setAiPrompt('');
    } catch (err) {
      alert(`AI Error: Could not connect to AI service.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:8001/trips/${tripId}`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      fetchStats();
    } catch (err) {
      alert("Failed to delete trip.");
    }
  };

  return (
    <div className="db-page-wrap">
      <div className="db-bg-mesh" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" style={{ opacity: 0.1, width: '500px', height: '500px', background: 'radial-gradient(circle, var(--green-light) 0%, transparent 60%)', top: '30%', right: '-200px', animationDelay: '-12s' }} />

      {showModal && <AddTripModal onClose={() => setShowModal(false)} onAdd={() => { fetchTrips(); fetchStats(); }} />}

      <div className="db-container">
        <div className="db-header-section">
          <div className="db-header-badge">
            <span className="db-date-dot" style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 className="db-main-title">{greeting} {greetEmoji}</h1>
          <p className="db-main-subtitle">
            <Sparkles size={16} style={{ color: 'var(--accent)', display: 'inline', marginRight: 4 }} /> 
            Here's what's happening with your hostel essentials.
          </p>
        </div>

        <section className="db-ai-section">
          <form className="db-ai-input-bar" onSubmit={handleAISubmit}>
            <Bot size={20} color="var(--accent)" />
            <input 
              type="text" 
              className="db-ai-input" 
              placeholder='Try "Going home this weekend, remind me to pack laptop"'
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              disabled={isAiLoading}
            />
            <button type="button" className={`db-ai-mic-btn ${isListening ? 'listening' : ''}`} onClick={handleStartVoice}>
              <Mic size={18} />
            </button>
            <button type="submit" className="db-ai-submit-btn" disabled={isAiLoading || !aiPrompt.trim()}>
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate
            </button>
          </form>
        </section>

        <div className="db-grid-row">
          <div>
            <div className="db-card-header">
              <div className="db-card-title-wrap">
                <div className="db-icon-box db-icon-box-accent"><Check size={20} /></div>
                <h2 className="db-card-title">Quick Actions</h2>
              </div>
            </div>
            <div className="db-quick-actions-grid">
              <div className="db-action-card" onClick={() => setShowModal(true)}>
                <div className="db-action-emoji" style={{ color: 'var(--amber)' }}>🏠</div>
                <div className="db-action-info">
                  <h3>Going Home</h3>
                  <p>Pack essentials & dirty clothes</p>
                </div>
                <div className="db-action-arrow">→</div>
              </div>
              
              <div className="db-action-card" onClick={() => setShowModal(true)}>
                <div className="db-action-emoji" style={{ color: 'var(--indigo)' }}>🏢</div>
                <div className="db-action-info">
                  <h3>Returning to PG</h3>
                  <p>Don't forget clean clothes</p>
                </div>
                <div className="db-action-arrow">→</div>
              </div>
            </div>
          </div>

          <div className="db-glass-card">
            <div className="db-card-header" style={{ marginBottom: 24 }}>
              <div className="db-card-title-wrap">
                <div className="db-icon-box db-icon-box-green"><Shirt size={20} /></div>
                <div>
                  <h3 className="db-card-title">Laundry Status</h3>
                  <p className="db-card-subtitle">Keep track of your wardrobe</p>
                </div>
              </div>
            </div>

            <div className="db-laundry-stats">
              <div className="db-stat-box clean">
                <p className="db-stat-num">{laundryStats.clean}</p>
                <p className="db-stat-lbl">Clean</p>
              </div>
              <div className="db-stat-box dirty">
                <p className="db-stat-num">{laundryStats.dirty}</p>
                <p className="db-stat-lbl">To Wash</p>
              </div>
              <div className="db-stat-box">
                <p className="db-stat-num">{total}</p>
                <p className="db-stat-lbl">Total</p>
              </div>
            </div>
            
            <div className="db-progress-group">
              <div className="db-progress-label clean">
                <span><Droplets size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> Clean & Ready</span>
                <span>{cleanPct}%</span>
              </div>
              <div className="db-progress-bar-container">
                <div className="db-progress-bar-fill fill-green" style={{ width: `${cleanPct}%` }}>
                  <div className="db-progress-bar-glow" />
                </div>
              </div>
            </div>
            <div className="db-progress-group" style={{ marginBottom: 0 }}>
              <div className="db-progress-label dirty">
                <span><Wind size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> Dirty / Pending</span>
                <span>{dirtyPct}%</span>
              </div>
              <div className="db-progress-bar-container">
                <div className="db-progress-bar-fill fill-red" style={{ width: `${dirtyPct}%` }}>
                  <div className="db-progress-bar-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="db-glass-card" style={{ animationDelay: '0.2s' }}>
          <div className="db-card-header">
            <div className="db-card-title-wrap">
              <div className="db-icon-box db-icon-box-indigo"><Calendar size={20} /></div>
              <h2 className="db-card-title">Upcoming Trips</h2>
            </div>
            <span className="db-badge db-badge-planned">{trips.length} active</span>
          </div>
          
          {tripsLoading ? (
            <div className="db-empty-state">
              <div className="db-empty-icon">⏳</div>
              <h3>Loading trips...</h3>
            </div>
          ) : trips.length === 0 ? (
            <div className="db-empty-state">
              <div className="db-empty-icon">🎒</div>
              <h3>No trips scheduled</h3>
              <p>Plan your next journey and keep track of your packing list.</p>
            </div>
          ) : (
            <div className="db-trips-list">
              {trips.map((trip) => {
                const tripTypeLabel = trip.trip_type;
                const tripIcon = tripTypeLabel.includes('Home') ? '🏠' : tripTypeLabel.includes('PG') || tripTypeLabel.includes('Return') ? '🏢' : '✈️';
                return (
                <div key={trip.id} className="db-trip-item" onClick={() => navigate(`/trip-manager?trip_id=${trip.id}`)}>
                  <div className="db-trip-emoji">{tripIcon}</div>
                  <div className="db-trip-info">
                    <h3 className="db-trip-title">{tripTypeLabel}</h3>
                    <p className="db-trip-date"><Calendar size={12} /> {formatDate(trip.trip_date)}</p>
                  </div>
                  <span className={`db-badge db-badge-${trip.status.toLowerCase()}`}>{trip.status}</span>
                  <button className="db-action-btn-delete" onClick={(e) => handleDeleteTrip(e, trip.id)} title="Delete trip">
                    <Trash2 size={16} />
                  </button>
                </div>
                );
              })}
            </div>
          )}
          
          <button className="db-add-trip-btn" onClick={() => setShowModal(true)}>
            <div className="db-add-trip-icon"><Plus size={20} /></div>
            <span>Plan a new trip</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;