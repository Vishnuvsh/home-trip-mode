import React, { useState } from 'react';
import { Navigation, CheckCircle, Package, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import './TripManager.css';

// --- Checklist Item-ന് വേണ്ടിയുള്ള Interface ---
interface ChecklistItem {
  id: number;
  category: string;
  item_name: string;
  is_completed: boolean;
}
// ----------------------------------------------

const TripManager: React.FC = () => {
  // സ്റ്റേറ്റുകൾക്ക് ടൈപ്പ് നൽകുന്നു
  const [tripType, setTripType] = useState<string>('Going Home');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form Event-ന് ടൈപ്പ് നൽകുന്നു
  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Mocking user_id = 1
      await axios.post('http://localhost:8000/trips/?user_id=1', {
        trip_type: tripType
      });
      
      // If trip is created, fetch the generated checklist
      // Note: In a complete app, you'd have a separate endpoint to fetch items by trip_id
      // For now, we are simulating the generated items
      setChecklist([
        { id: 1, category: 'Electronics', item_name: 'Phone Charger', is_completed: false },
        { id: 2, category: 'Essentials', item_name: 'Toothbrush', is_completed: false },
        ...(tripType === 'Going Home' ? [{ id: 3, category: 'Clothes (Laundry)', item_name: 'Dirty Jeans', is_completed: false }] : [])
      ]);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to create trip. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // itemId-ക്ക് ടൈപ്പ് (number) നൽകുന്നു
  const toggleItem = (itemId: number) => {
    setChecklist(checklist.map(item => 
      item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
    ));
  };

  return (
    <div className="tm-page">
      <div className="tm-container">
        <div className="tm-header">
          <h1 className="tm-title">Trip Manager</h1>
          <p className="tm-subtitle">Plan your journey and pack your essentials.</p>
        </div>

        {error && (
          <div className="tm-alert tm-alert-danger">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="tm-alert tm-alert-success">
            <Check size={18} />
            Trip created successfully! Here is your checklist.
          </div>
        )}

        <div className="tm-card">
          <div className="tm-card-title">
            <Navigation size={20} className="icon-blue" />
            Create a New Trip
          </div>
          
          <form onSubmit={handleCreateTrip}>
            <label className="tm-label">Where are you heading?</label>
            <select 
              value={tripType} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTripType(e.target.value)}
              className="tm-select"
            >
              <option value="Going Home">Going Home (Take dirty clothes)</option>
              <option value="Returning">Returning to PG (Bring clean clothes)</option>
            </select>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="tm-btn"
            >
              {isLoading ? 'Creating Trip...' : 'Start Trip & Generate Checklist'}
            </button>
          </form>
        </div>

        {/* Checklist Section - Shows up after creating a trip */}
        {checklist.length > 0 && (
          <div className="tm-card">
            <div className="tm-card-title">
              <Package size={20} className="icon-green" />
              Your Packing Checklist
            </div>
            
            <div className="tm-checklist">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  className={`tm-checklist-item ${item.is_completed ? 'completed' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="tm-item-left">
                    <CheckCircle 
                      size={24} 
                      className="tm-check-icon"
                    />
                    <div>
                      <h6 className="tm-item-name">{item.item_name}</h6>
                      <p className="tm-item-category">{item.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManager;