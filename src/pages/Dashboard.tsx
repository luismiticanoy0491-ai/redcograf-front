import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import WompiCheckout from '../components/WompiCheckout';

function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saasState, setSaasState] = useState<any>(null);

  useEffect(() => {
    API.get("/dashboard/resumen")
      .then((res) => {
        setDatos(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando dashboard:", err);
        setLoading(false);
      });

    API.get("/suscripciones/estado")
      .then(res => setSaasState(res.data))
      .catch(err => console.log("Trial Status Check failed", err));
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

  if (loading || !datos) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando métricas del negocio...</div>;
  }

  const { globales, categorias, alertasBajoStock } = datos;

  // Custom Tooltip for PieChart
  const CustomTooltipPie = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', zIndex: 1000, position: 'relative' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>{payload[0].name}</p>
          <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>{formatCOP(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      {saasState && (saasState.estado === 'Trial' || saasState.estado === 'Expired') && (
        <div style={{
          background: saasState.estado === 'Expired' ? '#fee2e2' : '#e0e7ff',
          color: saasState.estado === 'Expired' ? '#991b1b' : '#3730a3',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${saasState.estado === 'Expired' ? '#f87171' : '#818cf8'}`,
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {saasState.estado === 'Expired' ? '⚠️ Tu Suscripción Mensual ha Expirado' : `⏱️ Te quedan ${saasState.diasRestantes} días gratis de prueba`}
          </h3>
          <p style={{ margin: '0 0 15px 0' }}>Renueva tu plataforma POS ahora por solo <strong>$60.000 / mes</strong> con Wompi.</p>
          <WompiCheckout reference={`SUB_${localStorage.getItem('empresa_id')}_${Date.now()}`} amountInCents={6000000} />
        </div>
      )}

      <div className="header-section" style={{ marginBottom: '2rem' }}>
        <h2>Dashboard Financiero e Inventario</h2>
        <p>Visión global del estado de tu mercancía, alertas de reposición y capital invertido.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        <div className="card" style={{ backgroundColor: '#fff', borderLeft: '5px solid #3b82f6', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capital Invertido (Costo)</h4>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e293b' }}>
            {formatCOP(globales.total_invertido || 0)}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Total en inventario físico</p>
        </div>

        <div className="card" style={{ backgroundColor: '#fff', borderLeft: '5px solid #10b981', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyección de Ventas</h4>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#047857' }}>
            {formatCOP(globales.ganancia_proyectada || 0)}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Venta total si se agota el stock</p>
        </div>

        <div className="card" style={{ backgroundColor: '#fff', borderLeft: '5px solid #8b5cf6', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos Físicos Totales</h4>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#4c1d95' }}>
            {globales.total_articulos || 0}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Unidades sumadas en almacén</p>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* GRÁFICO: DISTRIBUCIÓN POR CATEGORÍA */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            📊 Valor de Inversión por Categoría
          </h3>
          <div style={{ width: '100%', height: 350 }}>
            {categorias.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                Sin datos suficientes para graficar.
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categorias.map(c => ({ 
                      ...c, 
                      valor_invertido: Number(c.valor_invertido) || 0 
                    })).filter(c => c.valor_invertido > 0)}
                    dataKey="valor_invertido"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={(props: any) => <CustomTooltipPie {...props} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ALERTAS DE BAJO STOCK */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#b91c1c', borderBottom: '1px solid #fee2e2', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Alertas de Bajo Stock (&lt; 5)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Artículos que requieren reabastecimiento pronto.</p>
          
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table className="modern-table" style={{ fontSize: '0.9rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                <tr>
                  <th>Ref/SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {alertasBajoStock.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#10b981', fontWeight: 'bold' }}>
                      ✅ Todo el inventario está en niveles óptimos.
                    </td>
                  </tr>
                ) : (
                  alertasBajoStock.map((prod) => (
                    <tr key={prod.id}>
                      <td style={{ color: '#64748b' }}>{prod.referencia || "N/A"}</td>
                      <td style={{ fontWeight: '500' }}>{prod.nombre} <br/><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{prod.categoria}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          backgroundColor: prod.cantidad === 0 ? '#fee2e2' : '#ffedd5',
                          color: prod.cantidad === 0 ? '#ef4444' : '#f97316',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          display: 'inline-block'
                        }}>
                          {prod.cantidad}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
