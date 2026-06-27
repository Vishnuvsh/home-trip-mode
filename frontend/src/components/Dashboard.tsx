import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import {
  Home, ArrowRightLeft, Shirt, AlertCircle,
  Calendar, ChevronRight, Plus, X, Check
} from 'lucide-react';
import axios from 'axios';
// @ts-ignore: Allow side-effect import for CSS without module declarations
import './Dashboard.css'; // Ensure you have a CSS file for styling

// --- Types & Interfaces ചേർക്കുന്നു ---
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
// ------------------------------------

const TRIP_TYPES = [
  { value: 'going_home', label: 'Going Home', icon: '🏠' },
  { value: 'returning', label: 'Returning to PG', icon: '🏢' },
  { value: 'weekend', label: 'Weekend Trip', icon: '🌄' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const STATUS_OPTIONS = ['Pending', 'Planned', 'Completed', 'Cancelled'];

const AddTripModal: React.FC<AddTripModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    type: 'going_home',
    date: '',
    status: 'Pending',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // field, value എന്നിവയ്ക്ക് ടൈപ്പ് നൽകുന്നു
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!form.date) {
      setError('Please select a date for the trip.');
      return;
    }
    const selectedType = TRIP_TYPES.find(t => t.value === form.type) || TRIP_TYPES[0]; // Fallback ചേർത്തു
    
    const newTrip: Trip = {
      id: Date.now(),
      type: selectedType.label,
      icon: selectedType.icon,
      date: form.date,
      status: form.status,
      note: form.note,
    };
    
    setSubmitted(true);
    setTimeout(() => {
      onAdd(newTrip);
      onClose();
    }, 900);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-pill">
              <Calendar size={18} />
            </div>
            <h2 className="modal-title">Add a trip</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <div className="success-circle">
              <Check size={28} color="#fff" />
            </div>
            <p className="success-text">Trip added!</p>
          </div>
        ) : (
          <div className="modal-body">
            {/* Trip Type */}
            <div className="form-group">
              <label className="form-label">Trip type</label>
              <div className="trip-type-grid">
                {TRIP_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`trip-type-btn ${form.type === t.value ? 'selected' : ''}`}
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
              <label className="form-label" htmlFor="trip-date">Date</label>
              <input
                id="trip-date"
                type="date"
                className="form-input"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => handleChange('date', e.target.value)}
              />
              {error && <p className="form-error">{error}</p>}
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
              <label className="form-label" htmlFor="trip-note">Note <span className="optional-tag">optional</span></label>
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
              <button className="btn-add" onClick={handleSubmit}>
                <Plus size={16} />
                Add trip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TripStatusBadge = ({ status }: { status: string }) => {
  const mapping: Record<string, string> = {
    Pending: 'badge-amber',
    Planned: 'badge-indigo',
    Completed: 'badge-green',
    Cancelled: 'badge-red',
  };
  const cls = mapping[status] || 'badge-amber';
  return <span className={`status-badge ${cls}`}>{status}</span>;
};

const Dashboard: React.FC = () => {
  const [laundryStats, setLaundryStats] = useState({ clean: 0, dirty: 0 });
  
  // Trip array-ക്ക് ടൈപ്പ് നൽകുന്നു
  const [trips, setTrips] = useState<Trip[]>([
    { id: 1, type: 'Going Home', icon: '🏠', date: '2026-06-20', status: 'Pending', note: '' },
    { id: 2, type: 'Returning to PG', icon: '🏢', date: '2026-06-22', status: 'Planned', note: '' },
  ]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Error state-ന് ടൈപ്പ് നൽകുന്നു
  const [error, setError] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:8000/laundry/stats/1');
        setLaundryStats(res.data);
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
        setError('Unable to load laundry data. Is the backend running?');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prev => [...prev, newTrip]);
  };

  // id-ക്ക് ടൈപ്പ് നൽകുന്നു
  const handleDeleteTrip = (id: number) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const total = laundryStats.clean + laundryStats.dirty;
  const cleanPct = total === 0 ? 0 : Math.round((laundryStats.clean / total) * 100);
  const dirtyPct = total === 0 ? 0 : Math.round((laundryStats.dirty / total) * 100);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      {showModal && (
        <AddTripModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTrip}
        />
      )}

      <Container className="db-page py-0 px-0" fluid>

        {/* Hero Header */}
        <div className="db-hero">
          <div className="db-hero-content">
            <p className="db-greeting">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="db-title">Good morning 👋</h1>
            <p className="db-subtitle">Your hostel essentials, at a glance.</p>
          </div>
          <div className="db-hero-bubble db-hero-bubble-1" />
          <div className="db-hero-bubble db-hero-bubble-2" />
        </div>

        <div className="db-body">

          {/* Error */}
          {error && (
            <Alert variant="danger" className="d-flex align-items-center mb-4 db-alert">
              <AlertCircle size={18} className="me-2 flex-shrink-0" />
              {error}
            </Alert>
          )}

          {/* Top Cards */}
          <Row className="g-3 mb-3">
            {/* Going Home */}
            <Col md={4}>
              <div className="db-card db-action-card h-100">
                <div className="action-icon action-icon-amber">
                  <Home size={20} />
                </div>
                <p className="action-title">Going Home</p>
                <p className="action-hint">Pack essentials & laundry</p>
                <div className="action-footer">
                  Start packing <ChevronRight size={14} />
                </div>
              </div>
            </Col>

            {/* Returning */}
            <Col md={4}>
              <div className="db-card db-action-card h-100">
                <div className="action-icon action-icon-indigo">
                  <ArrowRightLeft size={20} />
                </div>
                <p className="action-title">Returning to PG</p>
                <p className="action-hint">Don't forget clean clothes</p>
                <div className="action-footer">
                  Plan return <ChevronRight size={14} />
                </div>
              </div>
            </Col>

            {/* Laundry */}
            <Col md={4}>
              <div className="db-card db-laundry-card h-100">
                <div className="laundry-head">
                  <Shirt size={18} className="laundry-head-icon" />
                  <span className="laundry-head-title">Laundry</span>
                  {isLoading && <Spinner animation="border" size="sm" className="ms-auto" />}
                </div>

                <div className="laundry-row">
                  <div className="laundry-meta">
                    <span className="laundry-label">Clean</span>
                    <span className="laundry-val laundry-val-green">{laundryStats.clean} items</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-green" style={{ width: `${cleanPct}%` }} />
                  </div>
                </div>

                <div className="laundry-row" style={{ marginBottom: 0 }}>
                  <div className="laundry-meta">
                    <span className="laundry-label">Dirty</span>
                    <span className="laundry-val laundry-val-red">{laundryStats.dirty} items</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-red" style={{ width: `${dirtyPct}%` }} />
                  </div>
                </div>

                <div className="laundry-total">{total} items tracked total</div>
              </div>
            </Col>
          </Row>

          {/* Stat Strip */}
          <Row className="g-3 mb-4">
            <Col xs={6}>
              <div className="db-stat-box">
                <p className="stat-label">Clean items</p>
                <p className="stat-val stat-val-green">{laundryStats.clean}</p>
                <p className="stat-sub">{cleanPct}% of wardrobe ready</p>
              </div>
            </Col>
            <Col xs={6}>
              <div className="db-stat-box">
                <p className="stat-label">Need washing</p>
                <p className="stat-val stat-val-red">{laundryStats.dirty}</p>
                <p className="stat-sub">{dirtyPct}% need washing soon</p>
              </div>
            </Col>
          </Row>

          {/* Upcoming Trips */}
          <div className="db-section-title">
            <Calendar size={14} />
            Upcoming Trips
          </div>

          <div className="db-card db-trips-card mb-3">
            {trips.length === 0 ? (
              <div className="trips-empty">
                <Calendar size={32} className="trips-empty-icon" />
                <p className="trips-empty-msg">No trips planned yet. Add one below!</p>
              </div>
            ) : (
              trips.map((trip, idx) => (
                <div
                  key={trip.id}
                  className={`trip-item ${idx < trips.length - 1 ? 'trip-item-border' : ''}`}
                >
                  <div className="trip-emoji">{trip.icon}</div>
                  <div className="trip-info">
                    <p className="trip-name">{trip.type}</p>
                    <p className="trip-date">{formatDate(trip.date)}</p>
                    {trip.note ? <p className="trip-note">{trip.note}</p> : null}
                  </div>
                  <TripStatusBadge status={trip.status} />
                  <button
                    className="trip-delete-btn"
                    onClick={() => handleDeleteTrip(trip.id)}
                    aria-label="Delete trip"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button className="btn-add-trip" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add a trip
          </button>

        </div>
      </Container>
    </>
  );
};

export default Dashboard;