import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Calendar, Clock, LayoutGrid, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeveloperAgenda() {
  const { user } = useContext(AuthContext);
  const [developers, setDevelopers] = useState([]);
  const [selectedDevId, setSelectedDevId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.role === 'Administrador') {
      axios.get('http://localhost:5000/api/users')
        .then(res => setDevelopers(res.data.filter(u => u.role === 'Desarrollador')))
        .catch(console.error);
    } else if (user.role === 'Desarrollador') {
      setSelectedDevId(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDevId) {
      setLoading(true);
      axios.get(`http://localhost:5000/api/users/${selectedDevId}/tasks`)
        .then(res => {
          setTasks(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedDevId]);

  return (
    <div className="animate-fade-in">
      <header className="header" style={{marginBottom: '40px'}}>
        <div>
          <h1 className="gradient-text" style={{fontSize: '32px', marginBottom: '8px'}}>Agenda Consolidada</h1>
          <p style={{color: 'var(--text-muted)'}}>Visualización de carga de trabajo y compromisos técnicos</p>
        </div>
      </header>

      {user.role === 'Administrador' && (
        <div className="glass-panel" style={{padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px'}}>
          <div style={{background: 'var(--primary-glow)', padding: '12px', borderRadius: '12px'}}>
            <User color="var(--primary-color)" />
          </div>
          <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <label style={{display: 'block', fontSize: '11px', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px'}}>Seleccionar Desarrollador</label>
              <select 
                className="input-control" 
                value={selectedDevId} 
                onChange={e => setSelectedDevId(e.target.value)}
                style={{maxWidth: '400px'}}
              >
                <option value="">Seleccione un desarrollador para ver su agenda...</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name} ({dev.email})</option>
                ))}
              </select>
            </div>
            {tasks.length > 0 && (
              <div style={{textAlign: 'right', padding: '15px 25px', background: 'var(--primary-glow)', borderRadius: '16px', border: '1px solid var(--primary-color)'}}>
                <div style={{fontSize: '10px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '4px'}}>Carga Total Acumulada</div>
                <div style={{fontSize: '28px', fontWeight: 900, color: 'white'}}>
                  {tasks.reduce((acc, t) => acc + Math.round((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60)), 0)}
                  <span style={{fontSize: '14px', marginLeft: '6px', opacity: 0.8}}>HORAS</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>Cargando agenda...</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {tasks.map(task => (
            <div key={task.id} className="glass-panel" style={{padding: '24px', borderLeft: '4px solid var(--primary-color)', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '20px'}}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                  <span className="badge badge-desarrollo" style={{fontSize: '9px'}}>Tarea Técnica</span>
                  <Link to={`/improvement/${task.improvement_id}`} style={{fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                    {task.improvement_title} <ExternalLink size={12} />
                  </Link>
                </div>
                <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: '12px'}}>{task.description}</h3>
                <div style={{display: 'flex', gap: '24px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)'}}>
                    <Calendar size={16} /> {new Date(task.start_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)'}}>
                    <Clock size={16} /> {new Date(task.start_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.end_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '24px', fontWeight: 800, color: 'var(--text-color)'}}>
                  {Math.round((new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60))}
                  <span style={{fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px'}}>HRS</span>
                </div>
              </div>
            </div>
          ))}
          
          {selectedDevId && tasks.length === 0 && (
            <div style={{textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--glass-border)'}}>
              <p style={{color: 'var(--text-muted)'}}>Este desarrollador no tiene tareas programadas actualmente.</p>
            </div>
          )}
          
          {!selectedDevId && user.role === 'Administrador' && (
            <div style={{textAlign: 'center', padding: '100px'}}>
              <Calendar size={60} style={{color: 'var(--glass-border)', marginBottom: '20px'}} />
              <p style={{color: 'var(--text-muted)'}}>Selecciona un desarrollador para visualizar su cronograma consolidado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
