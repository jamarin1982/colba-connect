import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ArrowLeft, Check, Play, Send, Plus, Trash2 } from 'lucide-react';

export default function ImprovementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [improvement, setImprovement] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [taskFiles, setTaskFiles] = useState([]);
  const [socializationEmails, setSocializationEmails] = useState('');
  const [socializationDate, setSocializationDate] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [devList, setDevList] = useState([]);
  const [selectedDev, setSelectedDev] = useState('');

  const fetchImprovement = async () => {
    try {
      const response = await axios.get(`http://192.168.101.16:5000/api/improvements/${id}`);
      setImprovement(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchImprovement();
    if (user.role === 'Administrador') {
      axios.get('http://192.168.101.16:5000/api/users')
        .then(res => setDevList(res.data.filter(u => u.role === 'Desarrollador' || u.role === 'Administrador')))
        .catch(console.error);
    }
  }, [id]);

  const addTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', newTask);
    formData.append('startDate', taskStartDate);
    formData.append('endDate', taskEndDate);
    for (let i = 0; i < taskFiles.length; i++) {
      formData.append('attachments', taskFiles[i]);
    }

    try {
      await axios.post(`http://192.168.101.16:5000/api/improvements/${id}/tasks`, formData);
      setNewTask('');
      setTaskFiles([]);
      fetchImprovement();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al agregar tarea');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await axios.delete(`http://192.168.101.16:5000/api/improvements/tasks/${taskId}`);
      fetchImprovement();
    } catch (error) {
      
    }
  };

  const changeState = async (newState, emails = [], developerId = null, meetingDate = null) => {
    try {
      await axios.put(`http://192.168.101.16:5000/api/improvements/${id}/state`, { 
        state: newState, 
        emails,
        developerId,
        meetingDate
      });
      setShowEmailModal(false);
      fetchImprovement();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDesarrollado = (e) => {
    e.preventDefault();
    if (!socializationDate) {
      alert('Por favor selecciona una fecha y hora para la reunión de socialización.');
      return;
    }
    const emailList = socializationEmails.split(',').map(e => e.trim()).filter(e => e);
    changeState('Desarrollado', emailList, null, socializationDate);
  };

  const deleteImprovement = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar y eliminar esta mejora? Se enviará un correo notificando a los participantes del levantamiento.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/improvements/${id}`);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al procesar');
    }
  };

  if (!improvement) return <div style={{padding: '40px', textAlign: 'center'}}>Cargando...</div>;

  return (
    <div className="animate-fade-in">
      <button className="btn btn-outline" style={{marginBottom: '20px', border: 'none'}} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="glass-panel" style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
          <h2 style={{fontSize: '28px', color: 'var(--text-color)'}}>{improvement.title}</h2>
          <span className={`badge badge-${improvement.state.toLowerCase().replace(' ', '-')}`} style={{fontSize: '14px', padding: '6px 12px'}}>
            {improvement.state}
          </span>
        </div>
        <div style={{display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '14px'}}>
           <span style={{color: 'var(--text-muted)'}}>Solicitado por: <b>{improvement.creator_name}</b></span>
           {improvement.meeting_date && (
             <span style={{color: 'var(--text-muted)'}}>Reunión de Levantamiento: <b>{new Date(improvement.meeting_date).toLocaleString('es-CO')}</b></span>
           )}
        </div>
        <p style={{color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6}}>{improvement.description}</p>
      </div>

      <div className="detail-grid" style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px', alignItems: 'start'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
          {/* TASK CREATION SECTION - Only for assigned developer */}
          {improvement.state === 'Desarrollador Asignado' && improvement.developer_id === user.id && (
            <div className="glass-panel" style={{padding: '30px'}}>
              <h2 style={{fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Plus size={24} color="var(--primary-color)" /> Definición de Tarea Técnica
              </h2>
              <form onSubmit={addTask} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <input type="text" className="input-control" placeholder="Descripción de la tarea..." value={newTask} onChange={e => setNewTask(e.target.value)} required />
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <input type="datetime-local" className="input-control" value={taskStartDate} onChange={e => setTaskStartDate(e.target.value)} />
                  <input type="datetime-local" className="input-control" value={taskEndDate} onChange={e => setTaskEndDate(e.target.value)} />
                </div>
                <input type="file" className="input-control" multiple onChange={e => setTaskFiles(e.target.files)} />
                <button type="submit" className="btn btn-primary">Registrar Tarea</button>
              </form>
            </div>
          )}

          <div className="glass-panel" style={{padding: '32px'}}>
            <h3 style={{marginBottom: '24px', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Plus size={24} style={{color: 'var(--primary-color)'}} /> Plan de Ejecución ({improvement.tasks?.length || 0})
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {improvement.tasks?.map(task => {
                let attachments = [];
                try { attachments = task.attachments ? JSON.parse(task.attachments) : []; } catch(e) {}
                
                const isDone = task.status === 'Completada';
                const isOverdue = !isDone && task.end_date && new Date(task.end_date) < new Date();
                
                return (
                  <div key={task.id} className="glass-panel" style={{
                    padding: '20px', 
                    background: 'rgba(255,255,255,0.01)', 
                    borderLeft: `4px solid ${isDone ? '#10B981' : (isOverdue ? '#F43F5E' : 'var(--primary-color)')}`,
                    opacity: isDone ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                    boxShadow: isOverdue ? '0 0 15px rgba(244, 63, 94, 0.1)' : 'none'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                      <div>
                        <p style={{fontWeight: 600, fontSize: '16px', color: isOverdue ? '#F43F5E' : 'var(--text-color)', textDecoration: isDone ? 'line-through' : 'none'}}>{task.description}</p>
                        {isDone && task.completed_at && (
                          <div style={{fontSize: '9px', color: '#10B981', fontWeight: 700, marginTop: '4px'}}>
                            REALIZADA EL: {new Date(task.completed_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                        {isOverdue && (
                          <div style={{fontSize: '9px', color: '#F43F5E', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                            ⚠️ Tarea con retraso
                          </div>
                        )}
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {isDone ? (
                          <span className="badge badge-aprobado" style={{fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <Check size={10} /> Realizada
                          </span>
                        ) : isOverdue ? (
                          <span className="badge badge-desarrollado" style={{fontSize: '9px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #F43F5E'}}>Vencida</span>
                        ) : (
                          <span className="badge badge-tareas" style={{fontSize: '9px'}}>Pendiente</span>
                        )}
                        {improvement.state === 'Desarrollador Asignado' && improvement.developer_id === user.id && (
                          <button onClick={() => deleteTask(task.id)} style={{background: 'rgba(244, 63, 94, 0.1)', border: 'none', color: '#F43F5E', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex'}}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div style={{display: 'flex', gap: '24px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', width: 'fit-content'}}>
                      {task.start_date && (
                        <div style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase'}}>
                          <span style={{color: 'var(--primary-color)', marginRight: '4px'}}>●</span> Inicio: <span style={{color: 'var(--text-color)'}}>{new Date(task.start_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                      {task.end_date && (
                        <div style={{fontSize: '11px', color: isOverdue ? '#F43F5E' : 'var(--text-muted)', textTransform: 'uppercase'}}>
                          <span style={{color: isOverdue ? '#F43F5E' : 'var(--accent-color)', marginRight: '4px'}}>●</span> Fin: <span style={{color: isOverdue ? '#F43F5E' : 'var(--text-color)', fontWeight: isOverdue ? 700 : 400}}>{new Date(task.end_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{padding: '32px', position: 'sticky', top: '48px'}}>
          <h3 style={{marginBottom: '24px', fontSize: '20px', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px'}}>
            Panel de Control
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {improvement.state === 'Solicitado' && (user.id === improvement.creator_id || user.role === 'Administrador') && (
              <button className="btn btn-outline" style={{borderColor: 'rgba(244, 63, 94, 0.4)', color: '#F43F5E', width: '100%', justifyContent: 'center'}} onClick={deleteImprovement}>
                <Trash2 size={18} /> Cancelar Iniciativa
              </button>
            )}

            {/* Admin: Assign/Change Developer */}
            {['Solicitado', 'Desarrollador Asignado', 'Tareas Asignadas', 'Aprobado'].includes(improvement.state) && user.role === 'Administrador' && (
              <div style={{padding: '20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px solid var(--primary-color)', marginBottom: '20px'}}>
                <label style={{display: 'block', fontSize: '12px', color: 'var(--primary-color)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase'}}>{improvement.developer_id ? 'Cambiar Desarrollador' : 'Desarrollador Asignado'}</label>
                <select 
                  className="input-control" 
                  value={selectedDev} 
                  onChange={(e) => setSelectedDev(e.target.value)}
                  style={{marginBottom: '15px'}}
                >
                  <option value="">Seleccione un desarrollador...</option>
                  {devList.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name} ({dev.email})</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary" 
                  style={{width: '100%'}} 
                  onClick={() => changeState('Desarrollador Asignado', [], selectedDev)}
                >
                  {improvement.developer_id ? 'Confirmar Cambio' : 'Confirmar Asignación'}
                </button>
              </div>
            )}


            {/* Developer: Finalize Task Assignment */}
            {improvement.state === 'Desarrollador Asignado' && improvement.developer_id === user.id && (
              <button className="btn btn-primary" style={{width: '100%', marginBottom: '15px', padding: '16px'}} onClick={() => changeState('Tareas Asignadas')}>
                <Send size={18} /> Finalizar Asignación de Tareas
              </button>
            )}

            {improvement.state === 'Tareas Asignadas' && (user.role === 'Usuario' || user.role === 'Desarrollador') && user.id === improvement.creator_id && (
              <button className="btn btn-success" style={{width: '100%', justifyContent: 'center', height: '52px'}} onClick={() => changeState('Aprobado')}>
                <Check size={18} /> Aprobar Plan de Trabajo
              </button>
            )}

            {improvement.state === 'Aprobado' && user.role === 'Desarrollador' && (
              <button className="btn btn-warning" style={{width: '100%', justifyContent: 'center', height: '52px'}} onClick={() => changeState('En Desarrollo')}>
                <Play size={18} /> Iniciar Desarrollo
              </button>
            )}

            {improvement.state === 'En Desarrollo' && user.role === 'Desarrollador' && (() => {
              const completedTasks = improvement.tasks ? improvement.tasks.filter(t => t.status === 'Completada').length : 0;
              const totalTasks = improvement.tasks ? improvement.tasks.length : 0;
              const isFinished = totalTasks > 0 && completedTasks === totalTasks;
              
              return (
                <button 
                  className="btn btn-danger" 
                  disabled={!isFinished}
                  style={{
                    width: '100%', 
                    justifyContent: 'center', 
                    height: '52px', 
                    background: isFinished ? 'var(--danger-color)' : 'rgba(244, 63, 94, 0.2)', 
                    color: isFinished ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: isFinished ? 'pointer' : 'not-allowed',
                    border: isFinished ? 'none' : '1px solid rgba(244, 63, 94, 0.2)'
                  }} 
                  onClick={() => setShowEmailModal(true)}
                  title={!isFinished ? 'Debes completar todas las tareas (100%) antes de realizar la entrega.' : ''}
                >
                  <Check size={18} /> Entrega de Desarrollo {!isFinished && ` (${completedTasks}/${totalTasks})`}
                </button>
              );
            })()}

            {improvement.state === 'Desarrollado' && (
              <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center', height: '52px', background: 'var(--accent-color)'}} onClick={() => changeState('Socializado')}>
                <Send size={18} /> Socializar Iniciativa
              </button>
            )}
            
            {improvement.state === 'Socializado' && (
              <div style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                <CheckCircle2 size={32} style={{margin: '0 auto 12px'}} />
                <p style={{fontWeight: 600, fontSize: '14px'}}>Proyecto Implementado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEmailModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '500px'}}>
            <h2 style={{marginBottom: '20px'}}>Finalizar Desarrollo</h2>
            <form onSubmit={handleDesarrollado} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div>
                <label style={{display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', textTransform: 'uppercase'}}>Fecha y Hora de Socialización</label>
                <input 
                  type="datetime-local" 
                  className="input-control" 
                  value={socializationDate} 
                  onChange={e => setSocializationDate(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', textTransform: 'uppercase'}}>Participantes Adicionales</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={socializationEmails} 
                  onChange={e => setSocializationEmails(e.target.value)} 
                  placeholder="ejemplo1@empresa.com, ejemplo2@empresa.com" 
                />
                <p style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px'}}>
                  <b>Nota:</b> El creador, desarrollador y administradores ya están incluidos automáticamente. Use este campo solo para invitados extra.
                </p>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px'}}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEmailModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Terminar y Notificar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// force reload
