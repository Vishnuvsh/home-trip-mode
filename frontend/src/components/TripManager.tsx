import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, AlertCircle, Check, Loader2, Sparkles, Navigation } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  const { userId } = useAuth();
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
      const res = await axios.post(`http://localhost:8001/trips/?user_id=${userId}`, { trip_type: tripType });
      const newTripId = res.data.id;

      // Fetch the actual generated checklist from the DB
      const checklistRes = await axios.get(`http://localhost:8001/trips/${newTripId}/checklist`);
      setChecklist(checklistRes.data);
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
        user_id: userId 
      });

      const now = new Date().toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      
      setAiResult({
        ...response.data,
        created_at: now
      });

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

  const toggleItem = async (itemId: number) => {
    // Optimistic update
    setChecklist(prev =>
      prev.map(item => item.id === itemId ? { ...item, is_completed: !item.is_completed } : item)
    );
    try {
      await axios.put(`http://localhost:8001/checklist/${itemId}/toggle`);
    } catch {
      // Rollback on failure
      setChecklist(prev =>
        prev.map(item => item.id === itemId ? { ...item, is_completed: !item.is_completed } : item)
      );
    }
  };

  const completedCount = checklist.filter(i => i.is_completed).length;
  const progress = checklist.length === 0 ? 0 : Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="tm-page-wrap">
      {/* Dynamic Background Elements */}
      <div className="tm-bg-mesh" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" style={{ opacity: 0.15, width: '400px', height: '400px', background: 'radial-gradient(circle, var(--amber-light) 0%, transparent 60%)', top: '10%', right: '-100px', animationDelay: '-4s' }} />

      <div className="tm-container">

        {/* ── Header ── */}
        <div className="tm-header-section">
          <div className="tm-header-icon">
            <Navigation size={24} />
          </div>
          <h1 className="tm-main-title">Trip<span className="text-gradient">Planner</span></h1>
          <p className="tm-main-subtitle">Generate your smart packing checklist instantly.</p>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="alert alert-danger" style={{ maxWidth: '800px', margin: '0 auto 24px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && !aiResult && (
          <div className="alert alert-success" style={{ maxWidth: '800px', margin: '0 auto 24px' }}>
            <Check size={18} />
            Trip created! Your personalised checklist is below.
          </div>
        )}
        {aiResult && (
          <div className="alert alert-success" style={{ maxWidth: '800px', margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Sparkles size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{aiResult.ai_summary}</span>
            </div>
            
            <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(16, 208, 122, 0.3)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>📅 Travel Date</p>
                 <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                    {aiResult.detected_date_str}
                 </p>
               </div>
               
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🕒 Created On</p>
                 <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                    {aiResult.created_at}
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* ── AI Smart Assistant Card ── */}
        <div className="tm-glass-card tm-ai-card">
          <span className="tm-card-eyebrow" style={{ color: 'var(--accent)' }}>✨ AI Smart Packing Assistant (Best! ⭐)</span>
          <h2 className="tm-card-title">Describe your trip details</h2>

          <form onSubmit={handleAIAssistant}>
            <textarea
              className="tm-ai-input"
              placeholder="e.g. Going home for 4 days, rainy weather..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="tm-btn-ai"
            >
              {isLoading ? (
                <><Loader2 size={18} className="tm-spinner" /> Generating Custom Checklist…</>
              ) : (
                <><Sparkles size={18} /> AI Suggest Essentials ✨</>
              )}
            </button>
          </form>
        </div>

        {/* ── Trip Selection Card ── */}
        <div className="tm-glass-card" style={{ animationDelay: '0.2s' }}>
          <span className="tm-card-eyebrow">Step 1</span>
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
              className="tm-btn-primary"
            >
              {isLoading ? (
                <><Loader2 size={18} className="tm-spinner" /> Generating…</>
              ) : (
                <><Package size={18} /> Generate Checklist</>
              )}
            </button>
          </form>
        </div>

        {/* ── Checklist Card ── */}
        {checklist.length > 0 && (
          <div className="tm-glass-card" style={{ animationDelay: '0.3s' }}>
            <span className="tm-card-eyebrow">Step 2</span>
            
            <div className="tm-checklist-header">
              <h2 className="tm-card-title" style={{ margin: 0 }}>
                <CheckCircle2 size={24} className="tm-icon-green" /> Packing Checklist
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
                    style={{ animationDelay: `${idx * 0.05 + 0.4}s` }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
                  >
                    <div className={`tm-check-box ${item.is_completed ? 'checked' : ''}`}>
                      {item.is_completed && <Check size={16} strokeWidth={3} />}
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