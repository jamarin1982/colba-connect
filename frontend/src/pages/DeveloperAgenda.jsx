import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Calendar, Clock, LayoutGrid, User, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeveloperAgenda() {
  const { user } = useContext(AuthContext);
  const [developers, setDevelopers] = useState([]);
  const [selectedDevId, setSelectedDevId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = () => {
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
  };

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
    fetchTasks();
  }, [selectedDevId]);

  const toggleTask = async (taskId) => {
    try {
      await axios.put(`http://localhost:5000/api/improvements/tasks/${taskId}/toggle`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

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
          {tasks.map(task => {
            const isDone = task.status === 'Completada';
            const isOverdue = !isDone && task.end_date && new Date(task.end_date) < new Date();
            
            return (
              <div key={task.id} className="glass-panel agenda-item" style={{
                borderLeft: `4px solid ${isDone ? '#10B981' : (isOverdue ? '#F43F5E' : 'var(--primary-color)')}`, 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr auto', 
                alignItems: 'center', 
                gap: '20px',
                opacity: isDone ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: isOverdue ? '0 0 15px rgba(244, 63, 94, 0.1)' : 'none'
              }}>
                <button 
                  onClick={() => toggleTask(task.id)}
                  disabled={task.improvement_state !== 'En Desarrollo'}
                  style={{
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    cursor: task.improvement_state === 'En Desarrollo' ? 'pointer' : 'not-allowed', 
                    display: 'flex', 
                    alignItems: 'center',
                    opacity: task.improvement_state === 'En Desarrollo' ? 1 : 0.3
                  }}
                  title={task.improvement_state !== 'En Desarrollo' ? 'Solo se pueden marcar tareas cuando la mejora está "En Desarrollo"' : ''}
                >
                  {isDone ? <CheckCircle2 color="#10B981" size={28} /> : <Circle color={isOverdue ? '#F43F5E' : "rgba(255,255,255,0.2)"} size={28} />}
                </button>
                <div>
                  <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                    <span className={`badge ${isDone ? 'badge-aprobado' : (isOverdue ? 'badge-desarrollado' : 'badge-desarrollo')}`} style={{fontSize: '9px', background: isOverdue ? 'rgba(244, 63, 94, 0.2)' : '', borderColor: isOverdue ? '#F43F5E' : ''}}>
                      {isDone ? 'Completada' : (isOverdue ? 'Vencida' : 'Tarea Técnica')}
                    </span>
                    <Link to={`/improvement/${task.improvement_id}`} style={{fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                      {task.improvement_title} <ExternalLink size={12} />
                    </Link>
                    {isDone && task.completed_at && (
                      <span style={{fontSize: '9px', color: '#10B981', fontWeight: 700}}>
                        {new Date(task.completed_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{fontSize: '9px', color: '#F43F5E', fontWeight: 800, textTransform: 'uppercase'}}>⚠️ Retrasada</span>
                    )}
                  </div>
                  <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: '12px', textDecoration: isDone ? 'line-through' : 'none', color: isOverdue ? '#F43F5E' : 'var(--text-color)'}}>{task.description}</h3>
                  <div className="task-meta" style={{display: 'flex', gap: '24px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)'}}>
                      <Calendar size={16} /> {new Date(task.start_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isOverdue ? '#F43F5E' : 'var(--text-muted)'}}>
                      <Clock size={16} /> {new Date(task.start_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.end_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="hours-badge" style={{textAlign: 'right'}}>
                  <div style={{fontSize: '24px', fontWeight: 800, color: isDone ? '#10B981' : (isOverdue ? '#F43F5E' : 'var(--text-color)')}}>
                    {Math.round((new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60))}
                    <span style={{fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px'}}>HRS</span>
                  </div>
                </div>
              </div>
            );
          })}
          
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
