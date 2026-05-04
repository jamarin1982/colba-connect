import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [improvements, setImprovements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');

  const fetchImprovements = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/improvements');
      setImprovements(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchImprovements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const emailList = newEmails.split(',').map(e => e.trim()).filter(e => e);
    try {
      await axios.post('http://localhost:5000/api/improvements', {
        title: newTitle,
        description: newDesc,
        emails: emailList,
        meetingDate: newMeetingDate
      });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewEmails('');
      setNewMeetingDate('');
      fetchImprovements();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear mejora');
      console.error(error);
    }
  };

  const ALL_STATES = ['Solicitado', 'Desarrollador Asignado', 'Tareas Asignadas', 'Aprobado', 'En Desarrollo', 'Desarrollado', 'Socializado'];

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1 className="gradient-text" style={{fontSize: '36px', marginBottom: '4px'}}>Dashboard de Innovación</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '15px'}}>Monitoreo y gestión de procesos de mejora continua.</p>
        </div>
        {(user.role === 'Usuario' || user.role === 'Desarrollador') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusCircle size={20} /> Nueva Iniciativa
          </button>
        )}
      </div>

      <div className="grid">
        {improvements.map(imp => (
          <div key={imp.id} className="card glass-panel" onClick={() => navigate(`/improvement/${imp.id}`)} style={{cursor: 'pointer'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
              <h3 style={{fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', lineHeight: 1.3}}>{imp.title}</h3>
              <span style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em'}}>ID: CC-{imp.id.toString().padStart(4, '0')}</span>
            </div>
            
            <p style={{color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5}}>
              {imp.description}
            </p>

            <div style={{marginBottom: '28px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <div style={{display: 'flex', gap: '6px', marginBottom: '12px'}}>
                {ALL_STATES.map((s, i) => {
                  const isActive = imp.state === s;
                  const isPast = ALL_STATES.indexOf(imp.state) >= i;
                  return (
                    <div 
                      key={s} 
                      style={{
                        flex: 1, 
                        height: '6px', 
                        borderRadius: '3px', 
                        background: isActive ? 'var(--primary-color)' : (isPast ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.05)'),
                        boxShadow: isActive ? '0 0 12px var(--primary-color)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  );
                })}
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'}}>
                {ALL_STATES.map((s) => {
                  const isActive = imp.state === s;
                  return (
                    <span 
                      key={s} 
                      style={{
                        fontSize: '10px', 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        background: isActive ? 'var(--primary-color)' : 'transparent',
                        color: isActive ? '#0F172A' : 'rgba(255,255,255,0.4)',
                        fontWeight: isActive ? 800 : 500,
                        border: isActive ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px'}}>
              <div style={{fontSize: '11px', color: 'var(--text-color)', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: 'var(--text-muted)'}}>Líder:</span>
                <span style={{fontWeight: 600}}>{imp.creator_name}</span>
              </div>
              {imp.developer_name && (
                <div style={{fontSize: '11px', color: 'var(--text-color)', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-muted)'}}>Desarrollador:</span>
                  <span style={{color: 'var(--primary-color)', fontWeight: 600}}>{imp.developer_name}</span>
                </div>
              )}
              {imp.meeting_date && (
                <div style={{fontSize: '11px', color: 'var(--text-color)', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-muted)'}}>Agenda:</span>
                  <span style={{color: 'var(--primary-color)', fontWeight: 600}}>
                    {new Date(imp.meeting_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {imp.start_date && (
              <div style={{marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <span style={{fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase'}}>Progreso Técnico</span>
                  <span style={{fontSize: '14px', fontWeight: 900, color: 'var(--primary-color)'}}>{imp.progress_percent || 0}%</span>
                </div>
                <div style={{width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden'}}>
                  <div style={{width: `${imp.progress_percent || 0}%`, height: '100%', background: 'var(--primary-color)', boxShadow: '0 0 10px var(--primary-color)', transition: 'width 0.5s ease'}} />
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{fontSize: '11px'}}>{new Date(imp.start_date).toLocaleDateString('es-CO')}</span>
                    <span style={{color: 'var(--text-muted)'}}>→</span>
                    <span style={{fontSize: '11px'}}>{new Date(imp.end_date).toLocaleDateString('es-CO')}</span>
                  </div>
                  <span style={{fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)'}}>{imp.duration_hours}H</span>
                </div>
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px'}}>
              <span style={{color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'}}>
                Gestionar <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
        {improvements.length === 0 && (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)'}}>
            No hay mejoras registradas.
          </div>
        )}
      </div>

      {showModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)', overflowY: 'auto', zIndex: 2000}}>
          <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px'}}>
            <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '680px', padding: '50px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', background: 'rgba(15, 23, 42, 0.98)', minHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'}}>
                <h2 style={{fontSize: '28px', fontWeight: 700, color: 'var(--primary-color)'}}>Nueva Iniciativa</h2>
                <button onClick={() => setShowModal(false)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>&times;</button>
              </div>

              <form onSubmit={handleCreate} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '30px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '12px', color: 'var(--primary-color)', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Título del Proyecto</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="¿Qué vamos a mejorar?"
                    style={{padding: '18px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px'}}
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label style={{display: 'block', fontSize: '12px', color: 'var(--primary-color)', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Descripción del Problema/Solución</label>
                  <textarea 
                    className="input-control" 
                    placeholder="Breve explicación..."
                    style={{padding: '18px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', resize: 'none', flex: 1, minHeight: '200px', fontSize: '15px'}}
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                    required
                  ></textarea>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '12px', color: 'var(--primary-color)', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Colaboradores (Correos)</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    style={{padding: '18px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px'}}
                    value={newEmails} 
                    onChange={e => setNewEmails(e.target.value)} 
                    placeholder="ej: nombre@grupocolba.com" 
                  />
                </div>

                <div style={{padding: '30px', background: 'rgba(56, 189, 248, 0.03)', borderRadius: '24px', border: '1px solid rgba(56, 189, 248, 0.2)'}}>
                  <label style={{display: 'block', fontSize: '12px', color: 'var(--primary-color)', marginBottom: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    Programar Reunión de Levantamiento <span style={{color: '#F43F5E'}}>*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    className="input-control" 
                    value={newMeetingDate} 
                    onChange={e => setNewMeetingDate(e.target.value)} 
                    required 
                    min={(() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      return now.toISOString().slice(0, 16);
                    })()}
                    style={{padding: '16px 20px', borderRadius: '12px', borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(15, 23, 42, 0.9)'}}
                  />
                  <p style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px'}}>
                    Indique la fecha y hora estimada para la reunión técnica inicial.
                  </p>
                </div>

                <div style={{display: 'flex', gap: '20px', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                  <button type="button" className="btn" style={{padding: '16px 48px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '14px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em'}} onClick={() => setShowModal(false)}>
                    DESCARTAR
                  </button>
                  <button type="submit" className="btn" style={{padding: '16px 48px', background: 'var(--primary-color)', border: 'none', color: '#0F172A', borderRadius: '14px', fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 0 30px var(--primary-glow)'}}>
                    LANZAR PROYECTO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
