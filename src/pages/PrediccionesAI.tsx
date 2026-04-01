import React, { useEffect, useState } from "react";
import API from "../api/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function PrediccionesAI() {
  const [tendenciaGeneral, setTendenciaGeneral] = useState([]);
  const [rankingIA, setRankingIA] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/ai/predicciones");
      setTendenciaGeneral(res.data.tendenciaGeneral);
      setRankingIA(res.data.rankingIA);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando motor de IA", error);
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: '15px', borderRadius: '8px', border: '1px solid #38bdf8', color: 'white' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#38bdf8' }}>{label}</p>
          {payload.map((entry, index) => (
             <p key={index} style={{ margin: '5px 0', color: entry.color }}>
               {entry.name}: {entry.value} unidades
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            🤖 Inteligencia y Predicciones de Negocio
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
            Algoritmo de Machine Learning basado en volumen histórico para evitar fisuras de stock.
          </p>
        </div>
        <div style={{ backgroundColor: '#f0fdf4', padding: '10px 20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <strong style={{ color: '#16a34a' }}>Motor Analítico: ONLINE</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <h2>Procesando Redes Estadísticas... 📊</h2>
          <p>Calculando millones de posibilidades matemáticas basadas en tu base de datos...</p>
        </div>
      ) : (
        <>
          {/* GRÁFICA MACROECONÓMICA */}
          <div className="card" style={{ padding: '25px', borderRadius: '16px', marginBottom: '3rem', backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
             <h2 style={{ color: '#1e293b', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                📈 Volumen de Rotación: Pasado y Proyección
             </h2>
             <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={tendenciaGeneral}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: 'Unidades Vendidas', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="total_unidades_reales" 
                      name="Volumen Histórico Real" 
                      stroke="#8b5cf6" 
                      strokeWidth={4} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="prediccion_proyectada" 
                      name="Proyección Estimada AI (Siguiente Mes)" 
                      stroke="#0ea5e9" 
                      strokeWidth={4} 
                      strokeDasharray="5 5" 
                      dot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* TABLA DE RECOMENDACIONES DE INVENTARIO */}
          <div className="card" style={{ padding: '25px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
              🎯 Decisiones Sugeridas por la IA
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Comparamos nuestra predicción de ventas de tu próximo mes con tu almacén actual. Esta es la orden de compra exacta que deberías hacer a tus proveedores hoy.
            </p>

            {rankingIA.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No hay datos suficientes para sugerir órdenes. Registra ventas al menos durante un mes para entrenar al modelo.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>PRODUCTO</th>
                      <th>CATEGORÍA</th>
                      <th style={{ textAlign: 'center' }}>MESES VENDIENDO</th>
                      <th style={{ textAlign: 'center', backgroundColor: '#f1f5f9' }}>ALMACÉN ACTUAL</th>
                      <th style={{ textAlign: 'center', color: '#8b5cf6' }}>PRONÓSTICO (AI)</th>
                      <th style={{ textAlign: 'center', fontWeight: 'bold' }}>ESTADO</th>
                      <th style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>ACCIÓN (PEDIR HOY)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingIA.map((prod) => (
                      <tr 
                        key={prod.id} 
                        style={prod.sugerencia_compra > 0 ? { backgroundColor: '#fef2f2' } : {}}
                      >
                        <td style={{ fontWeight: '600' }}>{prod.nombre}</td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{prod.categoria}</td>
                        <td style={{ textAlign: 'center' }}>{prod.meses_con_ventas}</td>
                        <td style={{ textAlign: 'center', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                          {prod.stock_actual}
                        </td>
                        <td style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: 'bold' }}>
                          {prod.prediccion_proximo_mes} uds.
                        </td>
                        <td style={{ textAlign: 'center' }}>
                           <span className={`badge`} style={{ 
                             backgroundColor: prod.status.includes('Urgente') ? '#fee2e2' : prod.status.includes('Estancado') ? '#e0f2fe' : '#dcfce3',
                             color: prod.status.includes('Urgente') ? '#dc2626' : prod.status.includes('Estancado') ? '#0284c7' : '#16a34a',
                             padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem'
                           }}>
                             {prod.status}
                           </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: prod.sugerencia_compra > 0 ? '900' : 'bold', color: prod.sugerencia_compra > 0 ? '#dc2626' : '#94a3b8' }}>
                          {prod.sugerencia_compra > 0 ? `+${prod.sugerencia_compra} uds.` : 'No pedir'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PrediccionesAI;
