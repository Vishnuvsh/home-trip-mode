import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavigationBar from './components/NavigationBar';
import Dashboard from './components/Dashboard';
import TripManager from './components/TripManager';
import LaundryTracker from './components/LaundryTracker';
import AuthPage from './components/AuthPage';

/* ── Protected Route wrapper ── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

/* ── Public Route (redirect if already logged in) ── */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const layoutClass = isDashboard ? 'layout-top-nav' : 'layout-sidebar';

  return (
    <div className={`app-container ${layoutClass}`}>
      {isAuthenticated && <NavigationBar />}
      <div className="app-shell">
        <Routes>
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trip-manager" element={<ProtectedRoute><TripManager /></ProtectedRoute>} />
          <Route path="/laundry-tracker" element={<ProtectedRoute><LaundryTracker /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;