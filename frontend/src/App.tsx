import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import Dashboard from './components/Dashboard';
import TripManager from './components/TripManager';
import LaundryTracker from './components/LaundryTracker';

function App() {
  return (
    <Router>
      <NavigationBar />
      <div className="min-h-screen bg-light">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trip-manager" element={<TripManager />} />
          <Route path='/laundry-tracker' element={<LaundryTracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;