import React, { useState, useEffect } from 'react';
import { Shirt, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import './LaundryTracker.css';

// 1. തുണികളുടെ ഡാറ്റയ്ക്ക് ഒരു TypeScript Interface ഉണ്ടാക്കുന്നു
interface ClothingItem {
    id: number;
    item_name: string;
    is_clean: boolean;
}

const LaundryTracker = () => {
    // 2. സ്റ്റേറ്റുകളിൽ Type കൊടുക്കുന്നു
    const [clothes, setClothes] = useState<ClothingItem[]>([]);
    const [newItemName, setNewItemName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Initial load - Mocking data for now
    useEffect(() => {
        setClothes([
            { id: 1, item_name: 'Black Hoodie', is_clean: false },
            { id: 2, item_name: 'Blue Jeans', is_clean: true },
            { id: 3, item_name: 'White T-Shirt', is_clean: false }
        ]);
    }, []);

    // 3. ഇവന്റിന് (e) React.FormEvent എന്ന് Type കൊടുക്കുന്നു
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        // പുതിയ ഐറ്റത്തിന് ClothingItem സ്ട്രക്ചർ കൊടുക്കുന്നു
        const newItem: ClothingItem = {
            id: Date.now(),
            item_name: newItemName,
            is_clean: true
        };

        setClothes([newItem, ...clothes]);
        setNewItemName('');
    };

    // 4. പാരാമീറ്ററിന് (id) number എന്ന് Type കൊടുക്കുന്നു
    const toggleStatus = (id: number) => {
        setClothes(clothes.map(cloth =>
            cloth.id === id ? { ...cloth, is_clean: !cloth.is_clean } : cloth
        ));
    };

    const cleanClothes = clothes.filter(c => c.is_clean);
    const dirtyClothes = clothes.filter(c => !c.is_clean);

    return (
        <div className="lt-page">
            <div className="lt-container">
                <div className="lt-header">
                    <h1 className="lt-title">Laundry Tracker</h1>
                    <p className="lt-subtitle">Keep track of your clean and dirty clothes.</p>
                </div>

                {error && (
                    <div className="lt-alert lt-alert-danger">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="lt-grid">
                    {/* Add New Item Form */}
                    <div className="lt-full-width">
                        <div className="lt-card">
                            <form onSubmit={handleAddItem} className="lt-form">
                                <input
                                    type="text"
                                    placeholder="Enter clothing item (e.g., Red Shirt, Jeans)"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="lt-input"
                                />
                                <button type="submit" className="lt-btn">
                                    <Plus size={20} /> Add Item
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Dirty Clothes Column */}
                    <div className="lt-card" style={{ borderTop: '3px solid rgba(244, 63, 94, 0.5)' }}>
                        <div className="lt-card-title">
                            <div className="lt-card-title-left">
                                <XCircle size={20} className="icon-danger" />
                                Dirty Clothes
                            </div>
                            <span className="lt-badge lt-badge-danger">{dirtyClothes.length}</span>
                        </div>

                        {dirtyClothes.length === 0 ? (
                            <div className="lt-list-empty">No dirty clothes! 🎉</div>
                        ) : (
                            <div className="lt-list">
                                {dirtyClothes.map(cloth => (
                                    <div key={cloth.id} className="lt-list-item">
                                        <div className="lt-item-left">
                                            <Shirt size={20} className="icon-gray" />
                                            <span>{cloth.item_name}</span>
                                        </div>
                                        <button
                                            className="lt-action-btn success"
                                            onClick={() => toggleStatus(cloth.id)}
                                        >
                                            Mark Clean
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clean Clothes Column */}
                    <div className="lt-card" style={{ borderTop: '3px solid rgba(16, 208, 122, 0.5)' }}>
                        <div className="lt-card-title">
                            <div className="lt-card-title-left">
                                <CheckCircle2 size={20} className="icon-success" />
                                Clean Clothes
                            </div>
                            <span className="lt-badge lt-badge-success">{cleanClothes.length}</span>
                        </div>

                        {cleanClothes.length === 0 ? (
                            <div className="lt-list-empty">Time to do some laundry! 🧺</div>
                        ) : (
                            <div className="lt-list">
                                {cleanClothes.map(cloth => (
                                    <div key={cloth.id} className="lt-list-item">
                                        <div className="lt-item-left">
                                            <Shirt size={20} className="icon-gray" />
                                            <span>{cloth.item_name}</span>
                                        </div>
                                        <button
                                            className="lt-action-btn danger"
                                            onClick={() => toggleStatus(cloth.id)}
                                        >
                                            Wear It
                                        </button>
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