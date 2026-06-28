import React, { useState } from 'react';
import { Shirt, Plus, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
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
    <div className="lt-page">
      <div className="lt-orb lt-orb-1" />
      <div className="lt-orb lt-orb-2" />

      <div className="lt-container">

        {/* Header */}
        <div className="lt-header">
          <div className="lt-header-icon">
            <Shirt size={22} />
            <Sparkles size={12} className="lt-header-sparkle" />
          </div>
          <div>
            <h1 className="lt-title">Laundry Tracker</h1>
            <p className="lt-subtitle">Know exactly what to pack — clean or dirty.</p>
          </div>
        </div>

        {error && (
          <div className="lt-alert lt-alert-danger">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Summary bar */}
        <div className="lt-summary-card">
          <div className="lt-summary-text">
            <span className="lt-summary-label">Wardrobe health</span>
            <span className="lt-summary-pct">{cleanPct}% clean</span>
          </div>
          <div className="lt-summary-track">
            <div className="lt-summary-fill" style={{ width: `${cleanPct}%` }} />
          </div>
          <div className="lt-summary-counts">
            <span className="lt-count-pill lt-count-green">
              <CheckCircle2 size={13} /> {cleanClothes.length} clean
            </span>
            <span className="lt-count-pill lt-count-red">
              <XCircle size={13} /> {dirtyClothes.length} dirty
            </span>
          </div>
        </div>

        {/* Add item form */}
        <div className="lt-add-card">
          <form onSubmit={handleAddItem} className="lt-form">
            <div className="lt-input-wrap">
              <Shirt size={16} className="lt-input-icon" />
              <input
                type="text"
                placeholder="Add a clothing item…"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="lt-input"
                id="clothing-item-input"
              />
            </div>
            <button type="submit" className="lt-btn" id="add-clothing-btn">
              <Plus size={18} /> Add
            </button>
          </form>
        </div>

        {/* Two-column clothes grid */}
        <div className="lt-grid">

          {/* Dirty Column */}
          <div className="lt-card lt-card-dirty">
            <div className="lt-card-header">
              <div className="lt-card-header-left">
                <XCircle size={18} className="lt-icon-red" />
                <h2 className="lt-card-title">Dirty</h2>
              </div>
              <span className={`lt-badge lt-badge-red ${recentId !== null ? 'badge-bounce' : ''}`}>
                {dirtyClothes.length}
              </span>
            </div>

            {dirtyClothes.length === 0 ? (
              <div className="lt-empty">
                <span className="lt-empty-icon">🎉</span>
                <p>All clean!</p>
              </div>
            ) : (
              <div className="lt-list">
                {dirtyClothes.map((cloth, idx) => (
                  <div
                    key={cloth.id}
                    className="lt-item lt-item-enter"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="lt-item-left">
                      <div className="lt-item-dot lt-dot-red" />
                      <span className="lt-item-name">{cloth.item_name}</span>
                    </div>
                    <div className="lt-item-actions">
                      <button
                        className="lt-action-btn lt-action-clean"
                        onClick={() => toggleStatus(cloth.id)}
                        title="Mark as clean"
                      >
                        <CheckCircle2 size={14} /> Clean
                      </button>
                      <button
                        className="lt-delete-btn"
                        onClick={() => removeItem(cloth.id)}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clean Column */}
          <div className="lt-card lt-card-clean">
            <div className="lt-card-header">
              <div className="lt-card-header-left">
                <CheckCircle2 size={18} className="lt-icon-green" />
                <h2 className="lt-card-title">Clean</h2>
              </div>
              <span className="lt-badge lt-badge-green">{cleanClothes.length}</span>
            </div>

            {cleanClothes.length === 0 ? (
              <div className="lt-empty">
                <span className="lt-empty-icon">🧺</span>
                <p>Time to do laundry!</p>
              </div>
            ) : (
              <div className="lt-list">
                {cleanClothes.map((cloth, idx) => (
                  <div
                    key={cloth.id}
                    className="lt-item lt-item-enter"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="lt-item-left">
                      <div className="lt-item-dot lt-dot-green" />
                      <span className="lt-item-name">{cloth.item_name}</span>
                    </div>
                    <div className="lt-item-actions">
                      <button
                        className="lt-action-btn lt-action-wear"
                        onClick={() => toggleStatus(cloth.id)}
                        title="Mark as dirty"
                      >
                        <Shirt size={14} /> Worn
                      </button>
                      <button
                        className="lt-delete-btn"
                        onClick={() => removeItem(cloth.id)}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LaundryTracker;