import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Login from './auth/Login';
import PasswordReset from './auth/PasswordReset';
import Dashboard from './components/Dashboard';
import Home from './components/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Home /> : <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/logs" 
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/reset-password" 
          element={<PasswordReset />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
