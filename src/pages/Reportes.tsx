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
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Inteligencia de Negocios
          </h1>
          <p className="text-slate-500 font-medium text-lg">Reportes financieros avanzados y análisis de recaudación en tiempo real.</p>
        </div>

        <div className="w-full xl:w-auto bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-6 no-print">
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rango de Fechas</label>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm font-bold outline-none text-slate-700" />
                <span className="text-slate-300 font-bold">→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm font-bold outline-none text-slate-700" />
                <button onClick={handleHoy} className="px-4 py-2 bg-white text-indigo-600 font-black text-[10px] rounded-xl shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors uppercase">Hoy</button>
              </div>
            </div>
            
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cajero</label>
              <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white outline-none">
                <option value="">TODOS LOS CAJEROS</option>
                {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white outline-none">
                <option value="">TODAS LAS CATEGORÍAS</option>
                {categoriasTienda.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
          
          {/* Main Metric Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[40px] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group border border-indigo-400">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Recaudación Total (Filtro Actual)</span>
                  <div className="text-5xl font-black tracking-tighter">{formatCOP(data.general.total_ingresos)}</div>
                  <p className="text-indigo-100 font-medium text-sm italic opacity-90">Rendimiento consolidado según los parámetros seleccionados.</p>
                </div>
                <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-700 border border-white/20">💎</div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-10 rounded-[40px] shadow-2xl shadow-emerald-200 text-white relative overflow-hidden group border border-emerald-400">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Utilidad Total (Ganancia Neta)</span>
                  <div className="text-5xl font-black tracking-tighter">{formatCOP(data.general.total_utilidad_global || 0)}</div>
                  <p className="text-emerald-100 font-medium text-sm italic opacity-90">Diferencia exacta entre la recaudación menos el costo de la mercancía.</p>
                </div>
                <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-700 border border-white/20">📈</div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Rendimiento por Categoría
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest bg-slate-50 px-4 py-2 rounded-full uppercase border border-slate-100">Ventas en Volúmen COP</div>
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
                      recaudado: Number(c.total_recaudado) || 0
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
                          return (
                            <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.categoria}</p>
                              <p className="text-indigo-600 font-black text-lg">{formatCOP(payload[0].value)}</p>
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Cajero Ranking Card */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-6 bg-amber-500 rounded-full"></span> Rendimiento de Personal
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Clasificación</span>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th className="pb-4 pl-2">Cajero</th>
                      <th className="pb-4 text-center">Tks</th>
                      <th className="pb-4 text-center font-black text-emerald-600">Utilidad</th>
                      <th className="pb-4 text-right pr-2">Total Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.rendimientoCajeros.length === 0 ? (
                      <tr><td colSpan={3} className="py-20 text-center font-bold text-slate-400 italic">Sin datos suficientes.</td></tr>
                    ) : (
                      data.rendimientoCajeros.map((c: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 pl-2">
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ring-4 ring-offset-2 ${
                                    i === 0 ? 'bg-amber-100 text-amber-700 ring-amber-50' : 'bg-slate-100 text-slate-600 ring-slate-50'
                                }`}>
                                    {i === 0 ? '🥇' : i + 1}
                                </span>
                                <span className="font-bold text-slate-800">{c.nombre || "Desconocido"}</span>
                            </div>
                          </td>
                          <td className="py-5 text-center">
                            <span className="font-black text-slate-400">{c.cantidad_facturas}</span>
                          </td>
                          <td className="py-5 text-center">
                            <span className="font-black text-emerald-600 tracking-tighter">{formatCOP(c.total_utilidad || 0)}</span>
                          </td>
                          <td className="py-5 text-right pr-2">
                            <div className="font-black text-slate-900">{formatCOP(c.dinero_recaudado)}</div>
                            <div className="flex gap-2 justify-end mt-1">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">💵 {formatCOP(c.dinero_efectivo)}</span>
                                <span className="text-[9px] font-black text-sky-600 uppercase tracking-tighter">💳 {formatCOP(c.dinero_transferencia)}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products Card */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Top Best Sellers
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Top 5</span>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th className="pb-4 pl-2">Producto Estrella</th>
                      <th className="pb-4 text-right pr-2">Vendidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.topProductos.length === 0 ? (
                      <tr><td colSpan={2} className="py-20 text-center font-bold text-slate-400 italic">No hay ventas operativas aún.</td></tr>
                    ) : (
                      data.topProductos.map((p: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 pl-2">
                             <div className="font-bold text-slate-800 leading-tight">{p.nombre}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{p.categoria}</div>
                          </td>
                          <td className="py-5 text-right pr-2">
                             <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl font-black tracking-tighter">
                                {p.total_vendido} <span className="text-[8px] opacity-60">UNIDADES</span>
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
