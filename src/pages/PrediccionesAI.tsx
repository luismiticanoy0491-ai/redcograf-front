import React, { useEffect, useState } from "react";
import API from "../api/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

function PrediccionesAI() {
  const [tendenciaGeneral, setTendenciaGeneral] = useState<any[]>([]);
  const [rankingIA, setRankingIA] = useState<any[]>([]);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-sky-500/30 p-5 rounded-2xl shadow-2xl">
          <p className="text-sky-400 font-black text-xs uppercase tracking-widest mb-3">{label}</p>
          <div className="space-y-2">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{entry.name}:</span>
                    <span className="text-sm font-black text-white">{entry.value} uds.</span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-1000 pb-20">
      
      {/* AI Header Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-12 mb-12 border border-slate-800 shadow-2xl group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Neural Engine Activo v3.2</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-2">
                    Inteligencia <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Predictiva ERP</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-xl italic">
                    Descifra patrones de consumo históricos para optimizar tu flujo de caja y evitar la ruptura de inventario.
                </p>
            </div>
            
            <div className="shrink-0 bg-white/5 backdrop-blur-md p-8 rounded-[40px] border border-white/10 text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Estado del Motor</span>
                <div className="text-emerald-400 font-black text-2xl flex items-center justify-center gap-3">
                    <span className="text-3xl">🛡️</span> ONLINE
                </div>
            </div>
        </div>
        
        {/* Decorative Grid/Glow */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] group-hover:bg-indigo-500/30 transition-colors duration-1000"></div>
      </div>

      {loading ? (
        <div className="py-40 text-center flex flex-col items-center gap-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Procesando Redes Bayesianas...</h2>
                <p className="text-slate-500 font-medium italic">Sincronizando millones de registros de venta...</p>
            </div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Main Macro Chart */}
          <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-700 relative overflow-hidden group">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 relative z-10">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-sky-500 rounded-full"></span> Análisis Macro de Rotación
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest pl-5 italic">Tendencia Interanual Proyectada</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-100"></span> Ventas Reales
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-3 h-3 border-2 border-sky-400 rounded-full shadow-lg shadow-sky-100 border-dashed animate-pulse"></span> Pronóstico IA
                    </div>
                </div>
             </div>

             <div className="h-[500px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendenciaGeneral}>
                    <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                    <Area 
                        type="monotone" 
                        dataKey="total_unidades_reales" 
                        name="Histórico Real" 
                        stroke="#6366f1" 
                        strokeWidth={6} 
                        fillOpacity={1} 
                        fill="url(#colorReal)" 
                        animationDuration={2000}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="prediccion_proyectada" 
                        name="IA (Siguiente Mes)" 
                        stroke="#0ea5e9" 
                        strokeWidth={4} 
                        strokeDasharray="10 10" 
                        fillOpacity={1} 
                        fill="url(#colorPredict)"
                        animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
             
             {/* Subtle Glow behind chart */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          </div>

          {/* AI Decision Recommendations Table */}
          <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm overflow-hidden relative group">
            <div className="mb-12 space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 lowercase">
                    <span className="w-12 h-1 bg-slate-950 rounded-full"></span> sugerencias inteligentes de abastecimiento
                </h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-3xl">
                    Estas recomendaciones optimizan tu inventario comparando la demanda estimada contra el stock actual en tiempo real.
                </p>
            </div>

            {rankingIA.length === 0 ? (
                <div className="py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Datos insuficientes para el modelo predictivo. Continua registrando ventas.</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-12">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 bg-slate-50/50">
                                <th className="px-12 py-6">Ficha del Producto</th>
                                <th className="px-8 py-6 text-center">Engagement (Meses)</th>
                                <th className="px-8 py-6 text-center bg-slate-100/30">Stock Actual</th>
                                <th className="px-12 py-6 text-right text-indigo-600">Demanda (IA)</th>
                                <th className="px-12 py-6 text-right">Decisión AI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rankingIA.map((prod) => (
                                <tr key={prod.id} className={`group transition-all duration-300 ${prod.sugerencia_compra > 0 ? 'bg-rose-50/30 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
                                    <td className="px-12 py-8">
                                        <div className="font-black text-slate-900 uppercase tracking-tight group-hover:text-sky-600 transition-colors">{prod.nombre}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{prod.categoria}</div>
                                    </td>
                                    <td className="px-8 py-8 text-center">
                                        <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {prod.meses_con_ventas}m
                                        </span>
                                    </td>
                                    <td className={`px-8 py-8 text-center bg-slate-50 group-hover:bg-transparent transition-colors`}>
                                        <div className={`text-xl font-black ${prod.stock_actual < 5 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                                            {prod.stock_actual}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="text-xl font-black text-indigo-700 tracking-tighter">
                                            {prod.prediccion_proximo_mes} uds.
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        {prod.sugerencia_compra > 0 ? (
                                            <div className="space-y-1">
                                                <div className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-100 uppercase tracking-widest">
                                                    📦 Solicitar +{prod.sugerencia_compra}
                                                </div>
                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-tighter block">{prod.status}</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 opacity-40">
                                                <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                                    Stock Suficiente
                                                </div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Optimización Completa</div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default PrediccionesAI;
