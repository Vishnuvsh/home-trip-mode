import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2, Clock } from 'lucide-react';
import api from '../api/axios';

export default function TripItinerary({ tripId }: { tripId: number }) {
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [dayNum, setDayNum] = useState(1);
  const [timeLabel, setTimeLabel] = useState('');
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItinerary();
  }, [tripId]);

  const fetchItinerary = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/itinerary`);
      setItinerary(res.data);
    } catch(e) {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeLabel || !activity) return;
    setLoading(true);
    try {
      const res = await api.post(`/trips/${tripId}/itinerary`, {
        day_number: dayNum,
        time_label: timeLabel,
        activity: activity
      });
      setItinerary([...itinerary, res.data].sort((a,b) => a.day_number - b.day_number || a.id - b.id));
      setTimeLabel(''); setActivity('');
    } catch(e) {}
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    setItinerary(prev => prev.filter(x => x.id !== id));
    try { await api.delete(`/itinerary/${id}`); } catch(e) {}
  };

  const days = Array.from(new Set(itinerary.map(i => i.day_number))).sort();

  return (
    <div className="tm-feature-container" style={{ marginTop: '24px' }}>
      <div className="tm-feature-header">
        <h2 style={{ display:'flex', alignItems:'center', gap:'8px', margin:0, color: '#fff' }}><Calendar className="tm-icon-green" color="var(--accent)"/> Daily Itinerary</h2>
      </div>
      
      <form className="tm-add-item-bar" onSubmit={handleAdd} style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input type="number" className="tm-add-input" title="Day Number" placeholder="Day (e.g. 1)" value={dayNum} onChange={e => setDayNum(parseInt(e.target.value) || 1)} style={{ maxWidth: '80px' }} />
        <input type="text" className="tm-add-input" placeholder="Time (e.g. 09:00 AM)" value={timeLabel} onChange={e => setTimeLabel(e.target.value)} style={{ maxWidth: '140px' }} />
        <input type="text" className="tm-add-input" placeholder="Activity..." value={activity} onChange={e => setActivity(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="tm-add-btn" disabled={loading || !timeLabel || !activity}>
          {loading ? <Loader2 size={16} className="tm-spinner"/> : <Plus size={16}/>} Add
        </button>
      </form>

      <div className="tm-checklist-list">
        {days.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)', fontSize: '14px' }}>No itinerary items added yet.</div>
        ) : (
          days.map(day => (
            <div key={day} style={{ marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Day {day}</h3>
              {itinerary.filter(i => i.day_number === day).map(item => (
                <div key={item.id} className="tm-checklist-item" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', marginBottom: '8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12}/> {item.time_label}
                    </div>
                    <span style={{ fontWeight: '500', color: '#fff' }}>{item.activity}</span>
                  </div>
                  <button type="button" className="tm-item-delete-btn" onClick={() => handleDelete(item.id)}><Trash2 size={15}/></button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
