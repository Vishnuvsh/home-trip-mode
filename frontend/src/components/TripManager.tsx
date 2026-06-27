import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { Navigation, CheckCircle, Package } from 'lucide-react';
import axios from 'axios';

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
      const response = await axios.post('http://localhost:8000/trips/?user_id=1', {
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
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <div className="mb-4 pb-3 border-bottom">
        <h1 className="h3 fw-bold text-dark mb-1">Trip Manager</h1>
        <p className="text-secondary mb-0">Plan your journey and pack your essentials.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Trip created successfully! Here is your checklist.</Alert>}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h4 className="h5 mb-4 d-flex align-items-center gap-2">
            <Navigation size={20} className="text-primary" /> 
            Create a New Trip
          </h4>
          
          <Form onSubmit={handleCreateTrip}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary">Where are you heading?</Form.Label>
              <Form.Select 
                value={tripType} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTripType(e.target.value)}
                className="form-select-lg"
              >
                <option value="Going Home">Going Home (Take dirty clothes)</option>
                <option value="Returning">Returning to PG (Bring clean clothes)</option>
              </Form.Select>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isLoading}
              className="w-100 py-2 fw-medium"
            >
              {isLoading ? 'Creating Trip...' : 'Start Trip & Generate Checklist'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Checklist Section - Shows up after creating a trip */}
      {checklist.length > 0 && (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            <h4 className="h5 mb-4 d-flex align-items-center gap-2">
              <Package size={20} className="text-success" /> 
              Your Packing Checklist
            </h4>
            
            <ListGroup variant="flush">
              {checklist.map((item) => (
                <ListGroup.Item 
                  key={item.id} 
                  className="px-0 py-3 d-flex align-items-center justify-content-between border-bottom"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <CheckCircle 
                      size={24} 
                      className={item.is_completed ? "text-success" : "text-secondary opacity-25"} 
                    />
                    <div>
                      <h6 className={`mb-0 ${item.is_completed ? 'text-decoration-line-through text-secondary' : 'text-dark'}`}>
                        {item.item_name}
                      </h6>
                      <small className="text-muted">{item.category}</small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TripManager;