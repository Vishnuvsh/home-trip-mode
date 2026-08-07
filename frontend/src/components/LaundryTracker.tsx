import React, { useState } from 'react';
import { Shirt, Plus, CheckCircle2, AlertCircle, Sparkles, Droplets, Wind } from 'lucide-react';
import './LaundryTracker.css';

interface ClothingItem {
  id: number;
  item_name: string;
  is_clean: boolean;
}

const LaundryTracker = () => {
  const [clothes, setClothes] = useState<ClothingItem[]>([
    { id: 1, item_name: 'Black Hoodie', is_clean: false },
    { id: 2, item_name: 'Blue Jeans',   is_clean: true  },
    { id: 3, item_name: 'White T-Shirt',is_clean: false },
  ]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [error] = useState<string | null>(null);
  const [recentId, setRecentId] = useState<number | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;

    const newItem: ClothingItem = { id: Date.now(), item_name: name, is_clean: true };
    setClothes(prev => [newItem, ...prev]);
    setRecentId(newItem.id);
    setNewItemName('');
    setTimeout(() => setRecentId(null), 600);
  };

  const toggleStatus = (id: number) => {
    setClothes(prev =>
      prev.map(c => c.id === id ? { ...c, is_clean: !c.is_clean } : c)
    );
  };

  const removeItem = (id: number) => {
    setClothes(prev => prev.filter(c => c.id !== id));
  };

  const cleanClothes = clothes.filter(c => c.is_clean);
  const dirtyClothes = clothes.filter(c => !c.is_clean);
  const total = clothes.length;
  const cleanPct = total === 0 ? 0 : Math.round((cleanClothes.length / total) * 100);

  return (
    <div className="page-container lt-page-wrap">
      {/* Dynamic Background Elements */}
      <div className="lt-bg-mesh" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="lt-container">
        
        {/* Premium Header */}
        <div className="lt-header-section">
          <div className="lt-header-badge">
            <Sparkles size={14} className="lt-sparkle-icon" />
            <span>Smart Wardrobe Management</span>
          </div>
          <h1 className="lt-main-title">Laundry<span className="text-gradient">Tracker</span></h1>
          <p className="lt-main-subtitle">Keep your wardrobe fresh and ready for your next trip.</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ maxWidth: '800px', margin: '0 auto 24px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Dashboard Top Row */}
        <div className="lt-dashboard-top">
          {/* Progress Card */}
          <div className="lt-glass-card lt-progress-card">
            <div className="lt-progress-header">
              <div>
                <h3 className="lt-card-title">Wardrobe Status</h3>
                <p className="lt-card-subtitle">{cleanPct}% Clean & Ready</p>
              </div>
              <div className="lt-progress-icon-wrap">
                <Droplets size={24} />
              </div>
            </div>
            <div className="lt-progress-bar-container">
              <div className="lt-progress-bar-fill" style={{ width: `${cleanPct}%` }}>
                <div className="lt-progress-bar-glow" />
              </div>
            </div>
            <div className="lt-stats-row">
              <div className="lt-stat-item">
                <CheckCircle2 size={16} className="lt-color-green" />
                <span>{cleanClothes.length} Clean</span>
              </div>
              <div className="lt-stat-item">
                <Wind size={16} className="lt-color-red" />
                <span>{dirtyClothes.length} Dirty</span>
              </div>
            </div>
          </div>

          {/* Add Item Form */}
          <div className="lt-glass-card lt-add-card">
            <div className="lt-card-header" style={{ marginBottom: '0' }}>
              <h3 className="lt-card-title">Add Clothing</h3>
              <p className="lt-card-subtitle">Register a new item to your wardrobe.</p>
            </div>
            <form onSubmit={handleAddItem} className="lt-premium-form">
              <div className="lt-input-group">
                <Shirt size={18} className="lt-input-icon" />
                <input
                  type="text"
                  placeholder="e.g. Vintage Denim Jacket..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="lt-premium-input"
                  id="clothing-item-input"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="lt-premium-btn" id="add-clothing-btn" disabled={!newItemName.trim()}>
                <Plus size={20} />
                <span>Add Item</span>
              </button>
            </form>
          </div>
        </div>

        {/* Columns Grid */}
        <div className="lt-lists-grid">
          
          {/* Dirty Column */}
          <div className="lt-glass-card lt-column-card" style={{ animationDelay: '0.1s' }}>
            <div className="lt-column-header">
              <div className="lt-column-title-wrap">
                <div className="lt-icon-box lt-icon-box-red">
                  <Wind size={20} />
                </div>
                <h2 className="lt-column-title">Laundry Basket</h2>
              </div>
              <span className={`lt-badge lt-badge-red ${recentId !== null ? 'bounce' : ''}`}>{dirtyClothes.length}</span>
            </div>

            <div className="lt-items-container">
              {dirtyClothes.length === 0 ? (
                 <div className="lt-empty-state">
                    <div className="lt-empty-icon-wrap">✨</div>
                    <p>Basket is empty. All clean!</p>
                 </div>
              ) : (
                 dirtyClothes.map((cloth, idx) => (
                   <div key={cloth.id} className="lt-item-row" style={{animationDelay: `${idx * 0.05 + 0.2}s`}}>
                      <div className="lt-item-info">
                         <div className="lt-status-dot lt-dot-red" />
                         <span className="lt-item-name">{cloth.item_name}</span>
                      </div>
                      <div className="lt-item-actions">
                         <button className="lt-action-btn lt-btn-clean" onClick={() => toggleStatus(cloth.id)} title="Mark as clean">
                           <CheckCircle2 size={16} /> <span className="lt-btn-text">Clean</span>
                         </button>
                         <button className="lt-action-btn lt-btn-delete" onClick={() => removeItem(cloth.id)} aria-label="Remove">×</button>
                      </div>
                   </div>
                 ))
              )}
            </div>
          </div>

          {/* Clean Column */}
          <div className="lt-glass-card lt-column-card" style={{ animationDelay: '0.2s' }}>
            <div className="lt-column-header">
              <div className="lt-column-title-wrap">
                <div className="lt-icon-box lt-icon-box-green">
                  <Droplets size={20} />
                </div>
                <h2 className="lt-column-title">Clean & Ready</h2>
              </div>
              <span className="lt-badge lt-badge-green">{cleanClothes.length}</span>
            </div>

            <div className="lt-items-container">
              {cleanClothes.length === 0 ? (
                 <div className="lt-empty-state">
                    <div className="lt-empty-icon-wrap">🧺</div>
                    <p>Time to do laundry!</p>
                 </div>
              ) : (
                 cleanClothes.map((cloth, idx) => (
                   <div key={cloth.id} className="lt-item-row" style={{animationDelay: `${idx * 0.05 + 0.3}s`}}>
                      <div className="lt-item-info">
                         <div className="lt-status-dot lt-dot-green" />
                         <span className="lt-item-name">{cloth.item_name}</span>
                      </div>
                      <div className="lt-item-actions">
                         <button className="lt-action-btn lt-btn-wear" onClick={() => toggleStatus(cloth.id)} title="Mark as worn">
                           <Shirt size={16} /> <span className="lt-btn-text">Worn</span>
                         </button>
                         <button className="lt-action-btn lt-btn-delete" onClick={() => removeItem(cloth.id)} aria-label="Remove">×</button>
                      </div>
                   </div>
                 ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LaundryTracker;