import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, PieChart, Activity, Users, Clock, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

const Metrics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://192.168.101.16:5000/api/improvements/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Analizando datos...</div>;
  if (!stats) return <div style={{padding: '40px', textAlign: 'center'}}>No hay datos disponibles.</div>;

  const totalImprovements = stats.states.reduce((acc, curr) => acc + curr.count, 0);
  const taskEfficiency = stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total * 100).toFixed(1) : 0;

  return (
    <div className="animate-fade-in" style={{paddingBottom: '40px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <div>
          <h1 style={{fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px'}}>Panel de Métricas</h1>
          <p style={{color: 'var(--text-muted)'}}>Indicadores clave de rendimiento y cumplimiento del proyecto.</p>
        </div>
        <div style={{display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px'}}>Estado del Sistema</div>
            <div style={{fontSize: '14px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end'}}>
              <Activity size={14} /> Operativo
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px'}}>
        <div className="glass-panel" style={{padding: '24px', position: 'relative', overflow: 'hidden'}}>
          <TrendingUp style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05}} size={120} />
          <div style={{color: 'var(--primary-color)', marginBottom: '12px'}}><Activity size={24} /></div>
          <div style={{fontSize: '36px', fontWeight: 800, color: 'white', marginBottom: '4px'}}>{totalImprovements}</div>
          <div style={{fontSize: '14px', color: 'var(--text-muted)'}}>Mejoras Registradas</div>
        </div>

        <div className="glass-panel" style={{padding: '24px', position: 'relative', overflow: 'hidden'}}>
          <CheckCircle2 style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: '#10B981'}} size={120} />
          <div style={{color: '#10B981', marginBottom: '12px'}}><BarChart3 size={24} /></div>
          <div style={{fontSize: '36px', fontWeight: 800, color: 'white', marginBottom: '4px'}}>{taskEfficiency}%</div>
          <div style={{fontSize: '14px', color: 'var(--text-muted)'}}>Eficiencia de Tareas</div>
        </div>

        <div className="glass-panel" style={{padding: '24px', position: 'relative', overflow: 'hidden', borderBottom: '4px solid #F43F5E'}}>
          <AlertTriangle style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: '#F43F5E'}} size={120} />
          <div style={{color: '#F43F5E', marginBottom: '12px'}}><Clock size={24} /></div>
          <div style={{fontSize: '36px', fontWeight: 800, color: 'white', marginBottom: '4px'}}>{stats.tasks.overdue}</div>
          <div style={{fontSize: '14px', color: 'var(--text-muted)'}}>Tareas Vencidas</div>
        </div>

        <div className="glass-panel" style={{padding: '24px', position: 'relative', overflow: 'hidden'}}>
          <Users style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05}} size={120} />
          <div style={{color: 'var(--accent-color)', marginBottom: '12px'}}><Users size={24} /></div>
          <div style={{fontSize: '36px', fontWeight: 800, color: 'white', marginBottom: '4px'}}>{stats.developers.length}</div>
          <div style={{fontSize: '14px', color: 'var(--text-muted)'}}>Desarrolladores Activos</div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
        {/* Progress by State */}
        <div className="glass-panel" style={{padding: '32px'}}>
          <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <PieChart size={20} color="var(--primary-color)" /> Distribución de Estados
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {stats.states.map((s, idx) => (
              <div key={idx}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px'}}>
                  <span style={{color: 'var(--text-color)', fontWeight: 600}}>{s.state}</span>
                  <span style={{color: 'var(--text-muted)'}}>{s.count} ({((s.count/totalImprovements)*100).toFixed(0)}%)</span>
                </div>
                <div style={{height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{
                    width: `${(s.count/totalImprovements)*100}%`, 
                    height: '100%', 
                    background: 'var(--primary-color)',
                    boxShadow: '0 0 10px var(--primary-glow)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Ranking */}
        <div className="glass-panel" style={{padding: '32px'}}>
          <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Activity size={20} color="var(--accent-color)" /> Ranking de Entregas
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {stats.developers.sort((a,b) => b.completed_count - a.completed_count).map((dev, idx) => (
              <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div style={{
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'var(--primary-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#0F172A'
                }}>
                  {idx + 1}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '15px', fontWeight: 600, color: 'white'}}>{dev.name}</div>
                  <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>Proyectos socializados con éxito</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)'}}>{dev.completed_count}</div>
                  <div style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Mejoras</div>
                </div>
              </div>
            ))}
            {stats.developers.length === 0 && (
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>No hay entregas registradas aún.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
