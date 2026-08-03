import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import './TripManager.css';

interface ChecklistItem {
  id: number;
  category: string;
  item_name: string;
  is_completed: boolean;
}

interface AIResponseData {
  detected_type: string;
  detected_date_str: string;
  extracted_items: string[];
  ai_summary: string;
  checklist: ChecklistItem[];
  created_at?: string;
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
  const [prompt, setPrompt] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIResponseData | null>(null);
  const [searchParams] = useSearchParams();
  const tripIdStr = searchParams.get('trip_id');

  useEffect(() => {
    if (tripIdStr) {
      const fetchChecklist = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`http://localhost:8001/trips/${tripIdStr}/checklist`);
          setChecklist(response.data);
        } catch (err) {
          setError('Could not load the selected trip.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchChecklist();
    }
  }, [tripIdStr]);

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setAiResult(null);

    try {
      await axios.post('http://localhost:8001/trips/?user_id=1', { trip_type: tripType });

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

  const handleAIAssistant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setAiResult(null);

    try {
      const response = await axios.post('http://localhost:8001/ai/quick-add', { 
        prompt: prompt,
        user_id: 1 
      });

      const now = new Date().toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      
      setAiResult({
        ...response.data,
        created_at: now
      });

      // The backend now returns checklist directly!
      if (response.data.checklist) {
        setChecklist(response.data.checklist);
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError('Could not reach the AI Engine. Make sure backend is running.');
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
    <div className="page-container">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

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
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && !aiResult && (
          <div className="alert alert-success">
            <Check size={18} />
            Trip created! Your personalised checklist is below.
          </div>
        )}
        {aiResult && (
          <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Sparkles size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{aiResult.ai_summary}</span>
            </div>
            
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Travel Date & Day</p>
                 <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>
                    {aiResult.detected_date_str}
                 </p>
               </div>
               
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🕒 Created On</p>
                 <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>
                    {aiResult.created_at}
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* AI Smart Assistant Card */}
        <div className="card tm-ai-card">
          <div className="tm-card-eyebrow" style={{ color: '#8b5cf6' }}>✨ AI Smart Packing Assistant (Best! ⭐)</div>
          <h2 className="tm-card-title">Describe your trip details</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            e.g. Going home for 4 days, rainy weather
          </p>

          <form onSubmit={handleAIAssistant}>
            <textarea
              className="tm-ai-input"
              placeholder="Enter your trip plans here..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="btn tm-btn-ai"
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="tm-spinner" /> Generating Custom Checklist…</>
              ) : (
                <><Sparkles size={18} /> AI Suggest Essentials ✨</>
              )}
            </button>
          </form>
        </div>

        {/* Trip Selection Card */}
        <div className="card">
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
              className="btn"
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
          <div className="card tm-checklist-card">
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
                      <span className={`pill pill-${colorKey}`}>
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