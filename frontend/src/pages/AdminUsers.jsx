import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { ShieldAlert, UserCheck, UserX } from 'lucide-react';

export default function AdminUsers() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Usuario' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://192.168.101.16:5000/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://192.168.101.16:5000/api/users', newUser);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'Usuario' });
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('Error creando usuario');
    }
  };

  const toggleUserStatus = async (id, active, role) => {
    try {
      await axios.put(`http://192.168.101.16:5000/api/users/${id}`, { active: active ? 0 : 1, role });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  if (user.role !== 'Administrador') {
    return <div style={{textAlign: 'center', marginTop: '50px'}}><ShieldAlert size={48} color="var(--danger-color)" /><p>Acceso denegado.</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1 className="gradient-text" style={{fontSize: '32px'}}>Administrar Usuarios</h1>
          <p style={{color: 'var(--text-muted)'}}>Crea, edita roles o desactiva accesos de usuarios.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Crear Usuario
        </button>
      </div>

      <div className="glass-panel" style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <th style={{padding: '12px', color: 'var(--text-muted)'}}>Nombre</th>
              <th style={{padding: '12px', color: 'var(--text-muted)'}}>Email</th>
              <th style={{padding: '12px', color: 'var(--text-muted)'}}>Rol</th>
              <th style={{padding: '12px', color: 'var(--text-muted)'}}>Estado</th>
              <th style={{padding: '12px', color: 'var(--text-muted)'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding: '12px'}}>{u.name}</td>
                <td style={{padding: '12px'}}>{u.email}</td>
                <td style={{padding: '12px'}}>
                  <span className={`badge`} style={{background: 'var(--bg-color)', border: '1px solid var(--border-color)'}}>{u.role}</span>
                </td>
                <td style={{padding: '12px'}}>
                  {u.active ? <span style={{color: 'var(--success-color)'}}>Activo</span> : <span style={{color: 'var(--danger-color)'}}>Inactivo</span>}
                </td>
                <td style={{padding: '12px'}}>
                  {u.id !== user.id && (
                    <button 
                      className={`btn ${u.active ? 'btn-danger' : 'btn-success'}`} 
                      style={{padding: '6px 12px', fontSize: '12px'}}
                      onClick={() => toggleUserStatus(u.id, u.active, u.role)}
                    >
                      {u.active ? <><UserX size={14}/> Desactivar</> : <><UserCheck size={14}/> Activar</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '400px'}}>
            <h2 style={{marginBottom: '20px'}}>Crear Usuario</h2>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label>Nombre</label>
                <input type="text" className="input-control" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-control" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <input type="password" className="input-control" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Rol</label>
                <select className="input-control" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="Usuario">Usuario</option>
                  <option value="Desarrollador">Desarrollador</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px'}}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
