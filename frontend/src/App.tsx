import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import NavigationBar from './components/NavigationBar';
import Dashboard from './components/Dashboard';
import TripManager from './components/TripManager';
import LaundryTracker from './components/LaundryTracker';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <NavigationBar />
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trip-manager" element={<TripManager />} />
            <Route path='/laundry-tracker' element={<LaundryTracker />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;