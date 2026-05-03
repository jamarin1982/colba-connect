import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) setError('Credenciales incorrectas o usuario inactivo');
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
      <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '420px', padding: '40px'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <div style={{display: 'inline-flex', padding: '12px', background: 'var(--primary-glow)', borderRadius: '12px', color: 'var(--primary-color)', marginBottom: '16px'}}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="gradient-text" style={{fontSize: '32px', marginBottom: '8px'}}>ColbaConnect</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>Gestión de Mejoras e Innovación</p>
        </div>

        {error && (
          <div style={{background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.2)'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Usuario Corporativo</label>
            <input 
              type="email" 
              className="input-control" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@grupocolba.com"
              required 
            />
          </div>
          <div style={{marginBottom: '32px'}}>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Contraseña</label>
            <input 
              type="password" 
              className="input-control" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', justifyContent: 'center', height: '48px'}}>
            <LogIn size={20} /> Acceder al Portal
          </button>
        </form>
      </div>
    </div>
  );
}
