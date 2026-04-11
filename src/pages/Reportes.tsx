import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function Reportes() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [cajeros, setCajeros] = useState<any[]>([]);
  const [filtroCajero, setFiltroCajero] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState(""); // "" | "1" | "0"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleHoy = () => {
    const d = new Date();
    const todayLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(todayLocal);
    setEndDate(todayLocal);
  };

  const [categoriasTienda, setCategoriasTienda] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
    API.get("/productos").then(res => {
      const dbProducts = res.data;
      const uniqueCats = Array.from(new Set(dbProducts.map((p: any) => p.categoria))).filter(Boolean);
      setCategoriasTienda(uniqueCats as string[]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroCajero) params.append("cajeroId", filtroCajero);
    if (filtroCategoria) params.append("categoria", filtroCategoria);
    if (filtroTipo) params.append("es_servicio", filtroTipo);
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

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header & Filters Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Inteligencia de Negocios
          </h1>
          <p className="text-slate-500 font-medium text-lg">Reportes financieros avanzados y análisis de recaudación en tiempo real.</p>
        </div>

        <div className="w-full xl:w-auto bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-6 no-print">
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Rango de Fechas</label>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm outline-none text-slate-700" />
                <span className="text-slate-300">→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm outline-none text-slate-700" />
                <button onClick={handleHoy} className="px-4 py-2 bg-white text-indigo-600 text-[10px] rounded-xl shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors uppercase">Hoy</button>
              </div>
            </div>
            
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Cajero</label>
              <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:bg-white outline-none">
                <option value="">TODOS LOS CAJEROS</option>
                {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:bg-white outline-none">
                <option value="">TODAS LAS CATEGORÍAS</option>
                {categoriasTienda.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Clasificación</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:bg-white outline-none">
                <option value="">📦 TODOS LOS ÍTEMS</option>
                <option value="0">🛒 SOLO PRODUCTOS</option>
                <option value="1">⚡ SOLO SERVICIOS</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Extrayendo métricas millonarias...</p>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Main Metric Cards - Executive Suite */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-2 block">Ventas Brutas</span>
                  <div className="text-3xl text-slate-900 tracking-tighter truncate">{formatCOP(data.general.total_ingresos)}</div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] uppercase italic">Ingresos Consolidados</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 select-none">💰</div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 mb-2 block">Utilidad Neta</span>
                  <div className="text-3xl text-emerald-600 tracking-tighter truncate">{formatCOP(data.general.total_utilidad_global || 0)}</div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] uppercase italic">
                      Margen: {data.general.total_ingresos > 0 ? ((data.general.total_utilidad_global / data.general.total_ingresos) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 select-none">📈</div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-sky-500 mb-2 block">Transacciones</span>
                  <div className="text-3xl text-sky-600 tracking-tighter truncate">{data.general.total_ventas}</div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 italic">
                    Tickets emitidos con éxito
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 select-none">🧾</div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 mb-2 block">Ticket Promedio</span>
                  <div className="text-3xl text-amber-600 tracking-tighter truncate">
                    {formatCOP(data.general.total_ventas > 0 ? (data.general.total_ingresos / data.general.total_ventas) : 0)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 italic">
                    Gasto medio por cliente
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 select-none">⚖️</div>
            </div>

          </div>

          {/* Chart Section */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Rendimiento por Categoría
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 tracking-widest bg-slate-50 px-4 py-2 rounded-full uppercase border border-slate-100">Ventas en Volúmen COP</div>
            </div>
            <div className="h-[400px] w-full">
              {data.ingresosCategorias.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold italic">
                  Sin ventas registradas bajo estos filtros.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.ingresosCategorias.map((c: any) => ({
                      categoria: c.categoria,
                      recaudado: Number(c.total_recaudado) || 0,
                      utilidad: Number(c.total_utilidad) || 0
                    })).filter((c: any) => c.recaudado > 0)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="categoria" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0].payload;
                          return (
                            <div className="bg-white p-5 shadow-2xl rounded-3xl border border-slate-100 min-w-[220px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">{dataPoint.categoria}</p>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase block">Venta Bruta</span>
                                  <p className="text-slate-900 font-black text-lg">{formatCOP(dataPoint.recaudado)}</p>
                                </div>
                                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase block">Utilidad Real (Ganancia)</span>
                                  <p className="text-emerald-700 font-black text-lg">{formatCOP(dataPoint.utilidad)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="recaudado" radius={[12, 12, 0, 0]} barSize={50}>
                      {data.ingresosCategorias.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-12">
            
            {/* Cajero Ranking Card Mejorado */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="w-2.5 h-8 bg-amber-500 rounded-full"></span> Rendimiento de Personal
                  </h3>
                  <p className="text-slate-400 text-sm font-medium ml-5">Productividad y ventas por cada cajero.</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100/50 shadow-sm shadow-amber-100/20">Clasificación de Ventas</span>
              </div>
              
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="text-[11px] text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="pb-4 pl-4">Cajero / Asesor</th>
                      <th className="pb-4 text-center">Tickets</th>
                      <th className="pb-4 text-center">Ticket Promedio</th>
                      <th className="pb-4 text-center">Utilidad Generada</th>
                      <th className="pb-4 text-right pr-4">Total Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.rendimientoCajeros.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center font-bold text-slate-300 italic uppercase text-xs tracking-widest">Sin datos suficientes para proyectar.</td></tr>
                    ) : (
                      data.rendimientoCajeros.map((c: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50/80 transition-all duration-300">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md transition-transform group-hover:scale-110 duration-500 ${
                                    i === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-50' : 
                                    i === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-2 ring-slate-50' : 
                                    'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 ring-2 ring-orange-50'
                                }`}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-base text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{c.nombre || "Asesor General"}</span>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Auditoría de Venta</span>
                                </div>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                               <span className="text-lg text-slate-900 tracking-tighter leading-none">{c.cantidad_facturas}</span>
                               <span className="text-[9px] text-slate-400 uppercase mt-1 tracking-tighter">Tickets</span>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                             <div className="inline-flex flex-col items-center">
                               <span className="text-base text-indigo-600 tracking-tighter leading-none">
                                  {formatCOP(c.cantidad_facturas > 0 ? (c.dinero_recaudado / c.cantidad_facturas) : 0)}
                               </span>
                               <span className="text-[9px] text-indigo-400 uppercase mt-1 tracking-tighter">Ticket Promedio</span>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100/50">
                               <span className="text-base tracking-tighter italic">{formatCOP(c.total_utilidad || 0)}</span>
                            </div>
                          </td>
                          <td className="py-4 text-right pr-4">
                            <div className="text-xl text-slate-900 tracking-tighter">{formatCOP(c.dinero_recaudado)}</div>
                            <div className="flex gap-2 justify-end mt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl">
                                   <span className="text-[8px] text-slate-400 uppercase tracking-widest">Efectivo:</span>
                                   <span className="text-[10px] text-slate-700 uppercase">{formatCOP(c.dinero_efectivo)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl">
                                   <span className="text-[8px] text-slate-400 uppercase tracking-widest">Transferencia:</span>
                                   <span className="text-[10px] text-slate-700 uppercase">{formatCOP(c.dinero_transferencia)}</span>
                                </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products Card - Full Width Rediseñado */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl text-indigo-600 tracking-tight flex items-center gap-3">
                    <span className="w-2.5 h-8 bg-indigo-600 rounded-full"></span> Top Best Sellers
                  </h3>
                  <p className="text-slate-400 text-sm font-medium ml-5">Análisis de productos con mayor frecuencia de salida.</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/20">Top 5 Estrellas</span>
              </div>
              
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="text-[11px] text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="pb-4 pl-4">Producto Estrella</th>
                      <th className="pb-4 text-center">Frecuencia de Salida</th>
                      <th className="pb-4 text-right pr-4">Rendimiento Operativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.topProductos.length === 0 ? (
                      <tr><td colSpan={3} className="py-24 text-center font-bold text-slate-300 italic uppercase text-xs tracking-widest">Sin registro de movimientos.</td></tr>
                    ) : (
                      data.topProductos.map((p: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50/80 transition-all duration-300">
                          <td className="py-4 pl-4">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors duration-500">📦</div>
                                <div className="flex flex-col text-left">
                                  <span className="text-base text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight uppercase leading-tight">{p.nombre}</span>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-mono mt-1">{p.categoria || "S / CAT"}</span>
                                </div>
                             </div>
                          </td>
                          <td className="py-4 text-center">
                             <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl tracking-tighter border border-indigo-100/50">
                                <span className="text-lg">{p.total_vendido}</span>
                                <span className="text-[10px] opacity-60">UNIDADES</span>
                             </div>
                          </td>
                          <td className="py-4 text-right pr-4">
                             <div className="flex flex-col items-end">
                                <div className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[10px] tracking-widest uppercase shadow-lg shadow-slate-200 group-hover:bg-indigo-900 transition-colors">Best Seller № {i+1}</div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 italic">Analítica de Consumo Local</span>
                             </div>
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
      )}
    </div>
  );
}

export default Reportes;
