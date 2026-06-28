import React, { useState } from 'react';
import { CheckCircle2, Package, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import './TripManager.css';

interface ChecklistItem {
  id: number;
  category: string;
  item_name: string;
  is_completed: boolean;
}

const TRIP_OPTIONS = [
  {
    value: 'Going Home',
    label: 'Going Home',
    emoji: '🏠',
    desc: 'Pack dirty clothes & essentials',
    color: 'amber',
  },
  {
    value: 'Returning',
    label: 'Returning to PG',
    emoji: '🏢',
    desc: 'Bring clean clothes & study gear',
    color: 'indigo',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Electronics':       'indigo',
  'Essentials':        'amber',
  'Clothes (Laundry)': 'red',
};

const TripManager: React.FC = () => {
  const [tripType, setTripType] = useState<string>('Going Home');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post('http://localhost:8000/trips/?user_id=1', { trip_type: tripType });

      setChecklist([
        { id: 1, category: 'Electronics',       item_name: 'Phone Charger', is_completed: false },
        { id: 2, category: 'Essentials',         item_name: 'Toothbrush',   is_completed: false },
        { id: 3, category: 'Essentials',         item_name: 'Wallet / ID',  is_completed: false },
        ...(tripType === 'Going Home'
          ? [{ id: 4, category: 'Clothes (Laundry)', item_name: 'Dirty Jeans', is_completed: false }]
          : []),
      ]);
      setSuccess(true);
    } catch {
      setError('Could not reach the backend. Make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (itemId: number) => {
    setChecklist(prev =>
      prev.map(item => item.id === itemId ? { ...item, is_completed: !item.is_completed } : item)
    );
  };

  const completedCount = checklist.filter(i => i.is_completed).length;
  const progress = checklist.length === 0 ? 0 : Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="tm-page">
      <div className="tm-orb tm-orb-1" />
      <div className="tm-orb tm-orb-2" />

      <div className="tm-container">

        {/* Header */}
        <div className="tm-header">
          <div className="tm-header-icon"><Sparkles size={22} /></div>
          <div>
            <h1 className="tm-title">Trip Planner</h1>
            <p className="tm-subtitle">Generate your smart packing checklist instantly.</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="tm-alert tm-alert-danger">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="tm-alert tm-alert-success">
            <Check size={18} />
            Trip created! Your personalised checklist is below.
          </div>
        )}

        {/* Trip Selection Card */}
        <div className="tm-card">
          <div className="tm-card-eyebrow">Step 1</div>
          <h2 className="tm-card-title">Where are you heading?</h2>

          <form onSubmit={handleCreateTrip}>
            <div className="tm-options-grid">
              {TRIP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`tm-option-card tm-option-${opt.color} ${tripType === opt.value ? 'selected' : ''}`}
                  onClick={() => setTripType(opt.value)}
                >
                  <span className="tm-option-emoji">{opt.emoji}</span>
                  <div className="tm-option-body">
                    <p className="tm-option-title">{opt.label}</p>
                    <p className="tm-option-desc">{opt.desc}</p>
                  </div>
                  {tripType === opt.value && (
                    <div className="tm-option-check">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="tm-btn"
              id="generate-checklist-btn"
            >
              {isLoading ? (
                <><Loader2 size={18} className="tm-spinner" /> Generating…</>
              ) : (
                <><Package size={18} /> Generate Checklist</>
              )}
            </button>
          </form>
        </div>

        {/* Checklist Card */}
        {checklist.length > 0 && (
          <div className="tm-card tm-checklist-card">
            <div className="tm-card-eyebrow">Step 2</div>
            <div className="tm-checklist-header">
              <h2 className="tm-card-title" style={{ margin: 0 }}>
                <CheckCircle2 size={22} className="tm-icon-green" /> Packing Checklist
              </h2>
              <span className="tm-progress-label">{completedCount}/{checklist.length}</span>
            </div>

            {/* Progress bar */}
            <div className="tm-progress-track">
              <div className="tm-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="tm-checklist-list">
              {checklist.map((item, idx) => {
                const colorKey = CATEGORY_COLORS[item.category] ?? 'accent';
                return (
                  <div
                    key={item.id}
                    className={`tm-checklist-item ${item.is_completed ? 'completed' : ''}`}
                    onClick={() => toggleItem(item.id)}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
                  >
                    <div className={`tm-check-box ${item.is_completed ? 'checked' : ''}`}>
                      {item.is_completed && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="tm-item-body">
                      <p className="tm-item-name">{item.item_name}</p>
                      <span className={`tm-category-pill tm-pill-${colorKey}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {progress === 100 && (
              <div className="tm-all-done">
                <span>🎉</span> All packed! Have a great trip.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManager;