import { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Login from './auth/Login';
import Dashboard from './components/Dashboard';
import Home from './components/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
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
