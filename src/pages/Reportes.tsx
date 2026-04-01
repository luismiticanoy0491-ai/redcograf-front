import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
function Reportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [cajeros, setCajeros] = useState([]);
  const [filtroCajero, setFiltroCajero] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleHoy = () => {
    const d = new Date();
    const todayLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(todayLocal);
    setEndDate(todayLocal);
  };

  const categoriasTienda = [
    "Perfumería", "Detalles", "Joyería", "Mecato", "Tecnología", "Papelería", "Maquinas-impresionlaser", "Otra"
  ];

  useEffect(() => {
    // Cargar cajeros para el filtro
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    // Armar querystring
    const params = new URLSearchParams();
    if (filtroCajero) params.append("cajeroId", filtroCajero);
    if (filtroCategoria) params.append("categoria", filtroCategoria);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    API.get(`/reportes/dashboard?${params.toString()}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filtroCajero, filtroCategoria, startDate, endDate]);

  return (
    <div className="fade-in">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2>Inteligencia de Negocios (Reportes)</h2>
          <p>Filtra y cruza datos financieros exactos sobre tu tienda en tiempo real.</p>
        </div>

        {/* CONTROLES DE FILTROS */}
        <div className="filters-container no-print" style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flexWrap: 'wrap' }}>
          
          {/* FECHAS */}
          <div className="form-group" style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderRight: '1px solid #eee', paddingRight: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>📅 Desde</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid #ccc', display: 'block' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>📅 Hasta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid #ccc', display: 'block' }} />
            </div>
            <button className="btn-secondary" onClick={handleHoy} style={{ padding: '0.55rem 1rem', borderRadius: '8px' }}>Hoy</button>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>👤 Filtrar por Cajero</label>
            <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="">TODOS LOS CAJEROS</option>
              {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>📦 Filtrar por Categoría</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="">TODAS LAS CATEGORÍAS</option>
              {categoriasTienda.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div style={{padding: '3rem', textAlign: 'center'}}><p>Extrayendo métricas millonarias...</p></div>
      ) : (
        <>
          {/* MÉTRICAS GLOBALES TIPO TARJETAS */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: 1, minWidth: '250px', backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}>
              <h4 style={{ color: '#bae6fd', fontWeight: '500' }}>Ingresos Exactos (Filtro Actual)</h4>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
                {formatCOP(data.general.total_ingresos)}
              </div>
            </div>
          </div>

          {/* GRÁFICA DE RENDIMIENTO DE CATEGORÍA */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'white', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              📈 Rendimiento de Recaudación por Categoría
            </h3>
            <div style={{ width: '100%', height: 350 }}>
              {data.ingresosCategorias.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                  Sin ventas registradas bajo estos filtros.
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart
                    data={data.ingresosCategorias.map(c => ({
                      categoria: c.categoria,
                      recaudado: Number(c.total_recaudado) || 0
                    })).filter(c => c.recaudado > 0)}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="categoria" 
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [formatCOP(value), "Total Recaudado"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="recaudado" radius={[6, 6, 0, 0]}>
                      {data.ingresosCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'][index % 7]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid-container">
            {/* INGRESOS DESGLOSADOS POR CATEGORIA */}
            <div className="card table-card">
              <h3>💰 Recaudación por Categoría</h3>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Subtotal Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ingresosCategorias.length === 0 ? (
                    <tr><td colSpan={2}>No hay ventas registradas en estos filtros.</td></tr>
                  ) : (
                    data.ingresosCategorias.map((c, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 'bold'}}>{c.categoria}</td>
                        <td style={{color: 'var(--primary)', fontWeight: 'bold'}}>{formatCOP(c.total_recaudado)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* RANKING CAJEROS */}
            <div className="card table-card">
              <h3>🏆 Rendimiento Financiero del Cajero</h3>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Cajero</th>
                    <th>Tickets Operados</th>
                    <th>Efectivo 💵</th>
                    <th>Tarjeta/App 💳</th>
                    <th>Total Dinero Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rendimientoCajeros.length === 0 ? (
                    <tr><td colSpan={5}>No hay datos suficientes.</td></tr>
                  ) : (
                    data.rendimientoCajeros.map((c, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 'bold'}}>{i === 0 ? '🥇 ' : ''}{c.nombre || "Desconocido"}</td>
                        <td>{c.cantidad_facturas} ventas</td>
                        <td style={{color: '#059669', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.05)'}}>{formatCOP(c.dinero_efectivo)}</td>
                        <td style={{color: '#3b82f6', fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.05)'}}>{formatCOP(c.dinero_transferencia)}</td>
                        <td style={{color: 'var(--success)', fontWeight: 'bold', borderLeft: '2px solid #e2e8f0'}}>{formatCOP(c.dinero_recaudado)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TOP PRODUCTOS */}
            <div className="card table-card">
              <h3>🔥 Top 5 Productos (Según Filtro)</h3>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Producto (Estrella)</th>
                    <th>Unidades Vendidas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.length === 0 ? (
                    <tr><td colSpan={2}>No hay ventas operativas aún.</td></tr>
                  ) : (
                    data.topProductos.map((p, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 'bold'}}>
                          {p.nombre}
                          <span style={{display: 'block', fontSize: '0.75rem', color: '#888'}}>{p.categoria}</span>
                        </td>
                        <td>{p.total_vendido} uds.</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default Reportes;
