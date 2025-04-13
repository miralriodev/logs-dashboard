import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Login from './auth/Login';
import Dashboard from './components/dashboard';
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
      </Routes>
    </Router>
  );
}

export default App;
