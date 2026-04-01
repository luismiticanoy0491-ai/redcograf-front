import React, { useState, useEffect } from 'react';
import API from '../api/api';

const SuperAdminSaaS = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEmpresas, resPagos] = await Promise.all([
          API.get('/suscripciones/superadmin/empresas'),
          API.get('/suscripciones/superadmin/pagos')
        ]);
        setEmpresas(resEmpresas.data);
        setPagos(resPagos.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'No Autorizado o problema de conexión.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Métricas Computadas
  const activas = empresas.filter(e => e.estado === 'Active').length;
  const expiradas = empresas.filter(e => e.estado === 'Expired').length;
  const trials = empresas.filter(e => e.estado === 'Trial').length;
  
  const totalHistorico = empresas.reduce((acc, emp) => acc + (Number(emp.total_recaudado) || 0), 0);

  // Ingresos generados ESTE MES
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const ingresosEsteMes = pagos.reduce((acc, pago) => {
    // Si no hay fecha de pago en BD, asumimos todo al histórico. Para filtrar mejor la BD debe tener 'fecha_pago'
    if (pago.fecha_pago) {
      const fecha = new Date(pago.fecha_pago);
      if (fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear) {
         return acc + (Number(pago.monto) || 0);
      }
    } else {
      // Fallback: Si no existe fecha_pago, sumamos todo o usamos asunción
      return acc + (Number(pago.monto) || 0);
    }
    return acc;
  }, 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
       <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
       <h3 style={{ marginTop: '1rem', color: '#64748b' }}>Cargando Panel Maestro SaaS...</h3>
       <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ background: '#fee2e2', padding: '2rem', borderRadius: '16px', border: '2px solid #ef4444', textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ margin: 0, color: '#991b1b' }}>🛑 Acceso Denegado</h2>
        <p style={{ color: '#b91c1c', marginTop: '1rem' }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', color: '#0f172a', padding: '2.5rem', borderRadius: '20px', marginBottom: '2.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.8rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', letterSpacing: '-0.5px' }}>
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>👑</span> 
          <span style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Portal Maestro SaaS</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.2rem', margin: 0, fontWeight: '500' }}>Supervisión Global, Métricas y Cobranzas Directas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '4px solid #10b981' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Comercios Activos</h3>
          <p style={{ fontSize: '3.5rem', margin: '0.5rem 0 0', fontWeight: '800', color: '#10b981', lineHeight: '1' }}>{activas}</p>
        </div>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '4px solid #3b82f6' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>En Periodo Trial</h3>
          <p style={{ fontSize: '3.5rem', margin: '0.5rem 0 0', fontWeight: '800', color: '#3b82f6', lineHeight: '1' }}>{trials}</p>
        </div>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '4px solid #ef4444' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>En Mora / Expirados</h3>
          <p style={{ fontSize: '3.5rem', margin: '0.5rem 0 0', fontWeight: '800', color: '#ef4444', lineHeight: '1' }}>{expiradas}</p>
        </div>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '2px solid #22c55e' }}>
          <h3 style={{ margin: 0, color: '#166534', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Ingresos Este Mes</h3>
          <p style={{ fontSize: '2.5rem', margin: '1rem 0 0', fontWeight: '800', color: '#15803d' }}>
            ${ingresosEsteMes.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        {/* Tabla Comercios */}
        <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Directorio de Suscriptores</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', fontSize: '0.95rem' }}>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Comercio</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Contacto</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Vencimiento</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Estado SaaS</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', color: '#64748b' }}>#{emp.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: '#0f172a' }}>{emp.nombre_comercial}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>NIT: {emp.nit || 'N/A'} | User: {emp.owner_username || 'Ninguno'}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                      {emp.telefono_contacto} <br/> {emp.correo_contacto}
                    </td>
                    <td style={{ padding: '1rem', color: '#475569' }}>
                      {new Date(emp.fecha_vencimiento_suscripcion).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block',
                        background: emp.estado === 'Active' ? '#dcfce7' : emp.estado === 'Trial' ? '#e0f2fe' : '#fee2e2',
                        color: emp.estado === 'Active' ? '#166534' : emp.estado === 'Trial' ? '#075985' : '#991b1b',
                        border: `1px solid ${emp.estado === 'Active' ? '#86efac' : emp.estado === 'Trial' ? '#7dd3fc' : '#fca5a5'}`
                      }}>
                        {emp.estado.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>
                      ${(Number(emp.total_recaudado) || 0).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Historial de Pagos */}
        <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Historial Directo de Pagos💳</span>
            <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 'bold' }}>Total Global: <span style={{ color: '#0f172a' }}>${totalHistorico.toLocaleString('es-CO')}</span></span>
          </h2>
          {pagos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
              <p style={{ fontSize: '1.2rem' }}>Aún no se registran pagos en el sistema de Suscripciones.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', fontSize: '0.95rem' }}>
                    <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Ref Pago ID</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Comercio</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Wompi Transaction</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Fecha Liquidación</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Monto Recibido</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(pago => (
                    <tr key={pago.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>#{pago.id}</td>
                      <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '600' }}>{pago.nombre_comercial}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#3b82f6' }}>{pago.wompi_transaction_id || 'Manual/N/A'}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleString() : 'Fecha no registrada'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>
                        + ${(Number(pago.monto) || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSaaS;
