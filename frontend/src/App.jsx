import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Home, Users, PlusCircle, LayoutDashboard, CheckCircle2, Menu, X, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Set up Axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ImprovementDetail from './pages/ImprovementDetail';
import AdminUsers from './pages/AdminUsers';
import DeveloperAgenda from './pages/DeveloperAgenda';
import Metrics from './pages/Metrics';
import { BarChart3 } from 'lucide-react';

export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSidebarOpen(false);
  };

  if (loading) return <div className="app-container"><h2 className="animate-fade-in" style={{margin:'auto'}}>Cargando...</h2></div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        {user ? (
          <div className="app-container">
            <div className="mobile-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <LayoutDashboard size={24} color="var(--primary-color)" />
                <span className="gradient-text" style={{fontSize: '18px', fontWeight: 800}}>ColbaConnect</span>
              </div>
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>

            <Sidebar user={user} logout={logout} isOpen={sidebarOpen} close={() => setSidebarOpen(false)} />
            
            <div className="main-content" onClick={() => setSidebarOpen(false)}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/improvement/:id" element={<ImprovementDetail />} />
                <Route path="/agenda" element={<DeveloperAgenda />} />
                {(user.role === 'Administrador' || user.role === 'Auditor') && <Route path="/metrics" element={<Metrics />} />}
                {user.role === 'Administrador' && <Route path="/users" element={<AdminUsers />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </Router>
    </AuthContext.Provider>
  );
}

function Sidebar({ user, logout, isOpen, close }) {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 className="gradient-text" style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <LayoutDashboard size={28} style={{color: 'var(--primary-color)'}} /> ColbaConnect
        </h2>
        {isOpen && <button onClick={close} style={{background:'none', border:'none', color:'var(--text-muted)'}} className="mobile-only"><X size={24}/></button>}
      </div>
      
      <nav>
        <Link to="/" className="nav-link" onClick={close}>
          <Home size={20} /> Dashboard
        </Link>
        {(user.role === 'Administrador' || user.role === 'Auditor') && (
          <Link to="/metrics" className="nav-link" onClick={close}>
            <BarChart3 size={20} /> Métricas
          </Link>
        )}
        {(user.role === 'Administrador' || user.role === 'Desarrollador') && (
          <Link to="/agenda" className="nav-link" onClick={close}>
            <Clock size={20} /> Agenda
          </Link>
        )}
        {user.role === 'Administrador' && (
          <Link to="/users" className="nav-link" onClick={close}>
            <Users size={20} /> Usuarios
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">{user.name}</p>
          <p className="user-role">{user.role}</p>
        </div>
        <button onClick={logout} className="btn btn-danger" style={{width: '100%', justifyContent: 'center', fontSize: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#F43F5E'}}>
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default App;
