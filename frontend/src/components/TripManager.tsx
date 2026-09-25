import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, AlertCircle, Check, Loader2, Sparkles, Navigation, Trash2, Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TripExpenses from './TripExpenses';
import TripItinerary from './TripItinerary';
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
  'Misc':              'green',
};

const CATEGORY_PRESETS = [
  { key: 'All', label: 'All Items', icon: '🎒' },
  { key: 'Clothes (Laundry)', label: 'Clothes', icon: '👕' },
  { key: 'Electronics', label: 'Electronics', icon: '🔌' },
  { key: 'Essentials', label: 'Essentials', icon: '🪥' },
];

const playSound = (type: 'check' | 'uncheck' | 'complete') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    
    if (type === 'check') {
      const oscillator = audioCtx.createOscillator();
      oscillator.connect(gainNode);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'uncheck') {
      const oscillator = audioCtx.createOscillator();
      oscillator.connect(gainNode);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'complete') {
      const freqs = [440, 554.37, 659.25]; // A major chord
      freqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 1.5);
      });
    }
  } catch(e) {}
};

const TripManager: React.FC = () => {
  const { userId } = useAuth();
  const [tripType, setTripType] = useState<string>('Going Home');
  const [prompt, setPrompt] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [tripData, setTripData] = useState<any>(null);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary' | 'expenses'>('checklist');
  const [aiResult, setAiResult] = useState<AIResponseData | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tripIdStr = searchParams.get('trip_id');

  // Filter & Quick Add States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('Essentials');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    if (tripIdStr) {
      const fetchChecklist = async () => {
        setIsLoading(true);
        try {
          const checklistRes = await api.get(`/trips/${tripIdStr}/checklist`);
          setChecklist(checklistRes.data);
          const tripRes = await api.get(`/trips/${tripIdStr}`);
          setTripData(tripRes.data);
          setCurrentTripId(Number(tripIdStr));
        } catch (err) {
          setError('Could not load the selected trip.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchChecklist();
    }
  }, [tripIdStr]);

  const resetTrip = () => {
    setChecklist([]);
    setAiResult(null);
    setSuccess(false);
    setCurrentTripId(null);
    setTripData(null);
    setSelectedCategory('All');
    setActiveTab('checklist');
    navigate('/trip-manager'); // Clear the URL params
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setAiResult(null);

    try {
      const res = await api.post(`/trips/?user_id=${userId}`, { trip_type: tripType });
      const newTripId = res.data.id;
      setCurrentTripId(newTripId);
      setTripData(res.data);

      // Fetch the actual generated checklist from the DB
      const checklistRes = await api.get(`/trips/${newTripId}/checklist`);
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
      const response = await api.post('/ai/quick-add', { 
        prompt: prompt,
        user_id: userId 
      });

      const now = new Date().toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      
      setAiResult({
        ...response.data,
        created_at: now
      });

      if (response.data.trip) {
        setCurrentTripId(response.data.trip.id);
        setTripData(response.data.trip);
      }

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

  const handleWhatsAppShare = () => {
    if (!tripData) return;
    const dateStr = new Date(tripData.trip_date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
    const dirtyCount = checklist.filter(i => i.category.includes('Laundry')).length;
    
    let text = '';
    if (tripData.trip_type.includes('Home')) {
      text = `Hey! I'm coming home on ${dateStr}. 🏠\nI'm bringing ${dirtyCount} items of clothes for laundry!`;
    } else {
      text = `Hey! I'm returning to PG on ${dateStr}. 🏢\nI have packed ${checklist.length} items safely.`;
    }
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;

    setIsAddingItem(true);
    const activeId = currentTripId || (tripData ? tripData.id : null);

    try {
      if (activeId) {
        const res = await api.post(`/trips/${activeId}/checklist`, {
          item_name: name,
          category: newItemCategory,
        });
        setChecklist(prev => [...prev, res.data]);
      } else {
        const fallbackItem: ChecklistItem = {
          id: Date.now(),
          item_name: name,
          category: newItemCategory,
          is_completed: false,
        };
        setChecklist(prev => [...prev, fallbackItem]);
      }
      setNewItemName('');
      playSound('check');
      triggerHaptic(40);
      showToast(`➕ Added "${name}"`);
    } catch (err) {
      showToast('Could not save item to backend.');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemId: number, itemName: string) => {
    e.stopPropagation();
    triggerHaptic(30);
    setChecklist(prev => prev.filter(i => i.id !== itemId));
    showToast(`🗑️ Removed "${itemName}"`);
    try {
      await api.delete(`/checklist/${itemId}`);
    } catch (err) {
      // Handled silently
    }
  };

  const toggleItem = async (itemId: number, itemName: string, wasCompleted: boolean) => {
    const isNowCompleted = !wasCompleted;

    if (isNowCompleted) {
      playSound('check');
      triggerHaptic(50);
      showToast(`✅ ${itemName} packed!`);
    } else {
      playSound('uncheck');
      triggerHaptic(30);
    }

    setChecklist(prev => {
      const newList = prev.map(item => item.id === itemId ? { ...item, is_completed: isNowCompleted } : item);
      
      const newCompletedCount = newList.filter(i => i.is_completed).length;
      if (newCompletedCount === newList.length && newCompletedCount > 0 && !wasCompleted) {
        playSound('complete');
        triggerHaptic([50, 100, 50, 100, 50]);
        setTimeout(() => setShowSuccessModal(true), 300);
      }
      return newList;
    });

    try {
      await api.put(`/checklist/${itemId}/toggle`);
    } catch {
      setChecklist(prev =>
        prev.map(item => item.id === itemId ? { ...item, is_completed: wasCompleted } : item)
      );
    }
  };

  const completedCount = checklist.filter(i => i.is_completed).length;
  const progress = checklist.length === 0 ? 0 : Math.round((completedCount / checklist.length) * 100);

  // Category filtering computation
  const currentTripType = tripData?.trip_type || tripType;
  const isGoingHome = currentTripType === 'Going Home';
  const dynamicCategories = Array.from(new Set(checklist.map(i => i.category)));
  const filterTabs = [
    ...(isGoingHome ? [{ key: 'All', label: 'All Items', icon: '🎒' }] : []),
    ...CATEGORY_PRESETS.filter(p => p.key !== 'All' && dynamicCategories.includes(p.key)),
    ...dynamicCategories
      .filter(c => !CATEGORY_PRESETS.some(p => p.key === c))
      .map(c => ({ key: c, label: c, icon: '📦' })),
  ];

  const effectiveCategory = (!isGoingHome && selectedCategory === 'All' && filterTabs.length > 0) 
    ? filterTabs[0].key 
    : selectedCategory;

  const filteredChecklist = effectiveCategory === 'All'
    ? checklist
    : checklist.filter(item => item.category === effectiveCategory);

  const getCatCount = (catKey: string) => {
    if (catKey === 'All') return checklist.length;
    return checklist.filter(i => i.category === catKey).length;
  };

  const getCatPacked = (catKey: string) => {
    if (catKey === 'All') return checklist.filter(i => i.is_completed).length;
    return checklist.filter(i => i.category === catKey && i.is_completed).length;
  };

  return (
    <div className="tm-page-wrap">
      {/* Dynamic Background Elements */}
      <div className="tm-bg-mesh" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {toastMsg && (
        <div className="tm-toast">
          {toastMsg}
        </div>
      )}

      {showSuccessModal && (
        <div className="tm-success-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="tm-success-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-success-icon-wrap">
              <span className="tm-success-emoji">🎉</span>
            </div>
            <h2 className="tm-success-title">All Packed!</h2>
            <p className="tm-success-subtitle">Safe Travels ✈️</p>
            <button className="tm-btn-primary tm-success-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="tm-success-close" onClick={() => setShowSuccessModal(false)}>×</button>
          </div>
        </div>
      )}

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
        {checklist.length === 0 && (
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
        )}

        {/* ── Trip Selection Card ── */}
        {checklist.length === 0 && (
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
                <><Package size={18} /> Create and Generate Checklist</>
              )}
            </button>
          </form>
        </div>
        )}

        {/* ── Checklist Card ── */}
        {checklist.length > 0 && (
          <div>
            <button 
              onClick={resetTrip}
              style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', transition: 'all 0.2s ease' }}
            >
              ← Plan New Trip
            </button>
            <div className="tm-glass-card" style={{ animationDelay: '0.3s' }}>
              <span className="tm-card-eyebrow">Step 2</span>
            
            <div className="tm-checklist-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 className="tm-card-title" style={{ margin: 0 }}>
                  <CheckCircle2 size={24} className="tm-icon-green" /> Packing Checklist
                </h2>
                <p className="tm-card-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 32px' }}>
                  Tap the items as you pack them into your bag.
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span className="tm-progress-label">{completedCount}/{checklist.length} Packed</span>
                {tripData && (
                  <button 
                    onClick={handleWhatsAppShare}
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    Share
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="tm-progress-track">
              <div className="tm-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* 🔥 Feature Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px' }}>
              <button 
                type="button" 
                onClick={() => setActiveTab('checklist')} 
                style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'checklist' ? 'var(--accent)' : 'transparent', color: activeTab === 'checklist' ? '#000' : 'var(--text-secondary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >📦 Packing List</button>
              <button 
                type="button" 
                onClick={() => setActiveTab('itinerary')} 
                style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'itinerary' ? 'var(--accent)' : 'transparent', color: activeTab === 'itinerary' ? '#000' : 'var(--text-secondary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >🗓️ Itinerary</button>
              <button 
                type="button" 
                onClick={() => setActiveTab('expenses')} 
                style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'expenses' ? 'var(--accent)' : 'transparent', color: activeTab === 'expenses' ? '#000' : 'var(--text-secondary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >💰 Expenses</button>
            </div>

            {activeTab === 'checklist' && (
              <>
              {/* 🏷️ Category Filter Tabs (Feature 5) */}
            <div className="tm-category-filters">
              {filterTabs.map(tab => {
                const isActive = effectiveCategory === tab.key;
                const totalInCat = getCatCount(tab.key);
                const packedInCat = getCatPacked(tab.key);
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`tm-filter-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(tab.key)}
                  >
                    <span className="tm-filter-icon">{tab.icon}</span>
                    <span className="tm-filter-label">{tab.label}</span>
                    <span className="tm-filter-badge">
                      {isActive && tab.key !== 'All' ? `${packedInCat}/${totalInCat}` : totalInCat}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 📋 Filtered Checklist Items */}
            <div className="tm-checklist-list">
              {filteredChecklist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)', fontSize: '14px' }}>
                  No items found in "{effectiveCategory}". Add one below! 🎒
                </div>
              ) : (
                filteredChecklist.map((item, idx) => {
                  const colorKey = CATEGORY_COLORS[item.category] ?? 'accent';
                  return (
                    <div
                      key={item.id}
                      className={`tm-checklist-item ${item.is_completed ? 'completed' : ''}`}
                      onClick={() => toggleItem(item.id, item.item_name, item.is_completed)}
                      style={{ animationDelay: `${idx * 0.04 + 0.1}s` }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && toggleItem(item.id, item.item_name, item.is_completed)}
                    >
                      <div className={`tm-check-box ${item.is_completed ? 'checked' : ''}`}>
                        {item.is_completed && <Check size={16} strokeWidth={3} />}
                      </div>
                      <div className="tm-item-body">
                        <p className="tm-item-name">{item.item_name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.is_completed ? (
                            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Packed</span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Pack</span>
                          )}
                          <span className={`pill pill-${colorKey}`}>
                            {item.category}
                          </span>
                          <button
                            type="button"
                            className="tm-item-delete-btn"
                            onClick={(e) => handleDeleteItem(e, item.id, item.item_name)}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ➕ Quick Add Custom Item (Feature 2) */}
            <form className="tm-add-item-bar" onSubmit={handleAddItem}>
              <input
                type="text"
                className="tm-add-input"
                placeholder="➕ Add custom item (e.g. Umbrella, Hall Ticket, Medicine)..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
              <select
                className="tm-add-select"
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
              >
                <option value="Essentials">🪥 Essentials</option>
                <option value="Electronics">🔌 Electronics</option>
                <option value="Clothes (Laundry)">👕 Clothes</option>
                <option value="Misc">📦 Other</option>
              </select>
              <button 
                type="submit" 
                className="tm-add-btn" 
                disabled={isAddingItem || !newItemName.trim()}
              >
                {isAddingItem ? <Loader2 size={16} className="tm-spinner" /> : <Plus size={16} />}
                <span>Add</span>
              </button>
            </form>

            {progress === 100 && (
              <div className="tm-all-done">
                <span>🎉</span> All packed! Have a great trip.
              </div>
            )}
            </>
            )}

            {activeTab === 'expenses' && currentTripId && (
              <TripExpenses tripId={currentTripId} />
            )}

            {activeTab === 'itinerary' && currentTripId && (
              <TripItinerary tripId={currentTripId} />
            )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManager;