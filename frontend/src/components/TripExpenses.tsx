import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function TripExpenses({ tripId }: { tripId: number }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/expenses`);
      setExpenses(res.data);
    } catch(e) {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    setLoading(true);
    try {
      const res = await api.post(`/trips/${tripId}/expenses`, {
        description: desc,
        amount: parseFloat(amount)
      });
      setExpenses([res.data, ...expenses]);
      setDesc(''); setAmount('');
    } catch(e) {}
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
    try { await api.delete(`/expenses/${id}`); } catch(e) {}
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="tm-feature-container" style={{ marginTop: '24px' }}>
      <div className="tm-feature-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display:'flex', alignItems:'center', gap:'8px', margin:0, color: '#fff' }}><DollarSign className="tm-icon-green" color="var(--accent)"/> Expense Tracker</h2>
        <div style={{ background: 'var(--amber-light)', color: 'var(--amber)', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
          Total: ₹{total.toFixed(2)}
        </div>
      </div>
      
      <form className="tm-add-item-bar" onSubmit={handleAdd} style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input type="text" className="tm-add-input" placeholder="Expense description..." value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 1 }} />
        <input type="number" className="tm-add-input" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} style={{ maxWidth: '120px' }} />
        <button type="submit" className="tm-add-btn" disabled={loading || !desc || !amount}>
          {loading ? <Loader2 size={16} className="tm-spinner"/> : <Plus size={16}/>} Add
        </button>
      </form>

      <div className="tm-checklist-list">
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)', fontSize: '14px' }}>No expenses added yet.</div>
        ) : (
          expenses.map(e => (
            <div key={e.id} className="tm-checklist-item" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{e.description}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(e.expense_date).toLocaleDateString()}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--amber)' }}>₹{e.amount.toFixed(2)}</span>
                <button type="button" className="tm-item-delete-btn" onClick={() => handleDelete(e.id)}><Trash2 size={15}/></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
