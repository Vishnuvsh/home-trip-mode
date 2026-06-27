import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TripManager from './components/TripManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-light">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trip-manager" element={<TripManager />} />
    
        </Routes>
      </div>
    </Router>
  );
}

export default App;