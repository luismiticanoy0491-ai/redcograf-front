import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import WompiCheckout from '../components/WompiCheckout';

function Dashboard() {
  const [datos, setDatos] = useState<any>(null);
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

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

  if (loading || !datos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Analizando métricas del negocio...</p>
      </div>
    );
  }

  const { globales, categorias, alertasBajoStock } = datos;

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-indigo-600 font-black text-lg">{formatCOP(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {saasState && (saasState.estado === 'Trial' || saasState.estado === 'Expired') && (
        <div className={`p-8 rounded-[32px] mb-12 border-2 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-8 duration-700 ${
          saasState.estado === 'Expired' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-indigo-50 border-indigo-100 text-indigo-900'
        }`}>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight">
              {saasState.estado === 'Expired' ? '⚠️ Suscripción Expirada' : `⏱️ Faltan ${saasState.diasRestantes} días de prueba`}
            </h3>
            <p className="font-medium text-lg opacity-80 decoration-indigo-200 decoration-2">Renueva tu plataforma POS ahora por solo <span className="font-black">$60.000 / mes</span>.</p>
          </div>
          <div className="shrink-0 bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50">
            <WompiCheckout reference={`SUB_${localStorage.getItem('empresa_id')}_${Date.now()}`} amountInCents={6000000} />
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Dashboard Financiero
          </h1>
          <p className="text-slate-500 font-medium text-lg">Visión global del estado de tu mercancía, capital y rendimiento.</p>
        </div>
        <div className="flex gap-2">
            <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 font-bold text-slate-600 text-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sistema en línea
            </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        
        <MetricCard 
            title="Capital Invertido" 
            value={formatCOP(globales.total_invertido || 0)} 
            desc="Costo total de mercancía en bodega" 
            icon="💰" 
            color="indigo" 
        />
        
        <MetricCard 
            title="Proyección de Ventas" 
            value={formatCOP(globales.ganancia_proyectada || 0)} 
            desc="Venta estimada si liquidas el stock" 
            icon="📈" 
            color="emerald" 
        />

        <MetricCard 
            title="Stock Físico" 
            value={globales.total_articulos || 0} 
            desc="Unidades totales registradas" 
            icon="📦" 
            color="amber" 
            isNumber
        />

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* Charts Section */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Distribución de Inversión
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Por Categoría</span>
          </div>
          <div className="h-[400px] w-full">
            {categorias.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold italic">
                Sin datos suficientes para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorias.map((c: any) => ({ 
                      ...c, 
                      valor_invertido: Number(c.valor_invertido) || 0 
                    })).filter((c: any) => c.valor_invertido > 0)}
                    dataKey="valor_invertido"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    innerRadius={80}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {categorias.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}  />
                    ))}
                  </Pie>
                  <Tooltip content={(props: any) => <CustomTooltipPie {...props} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-red-600 tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-red-600 rounded-full"></span> Alertas de Bajo Stock
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-100 bg-red-500 px-3 py-1 rounded-full">Crítico (&lt;5)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-none custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 pl-2">Producto</th>
                  <th className="pb-4 text-center">Referencia</th>
                  <th className="pb-4 text-right pr-2">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alertasBajoStock.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                      <div className="text-5xl mb-4">🏆</div>
                      <p className="font-black text-emerald-600 tracking-tight">¡Todo en orden!</p>
                      <p className="text-slate-400 font-medium text-sm">No hay faltantes registrados.</p>
                    </td>
                  </tr>
                ) : (
                  alertasBajoStock.map((prod: any) => (
                    <tr key={prod.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{prod.nombre}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.categoria}</div>
                      </td>
                      <td className="py-4 text-center">
                         <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{prod.referencia || "—"}</span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black tracking-tighter ${
                          prod.cantidad === 0 ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-amber-100 text-amber-700'
                        }`}>
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

function MetricCard({ title, value, desc, icon, color, isNumber }: any) {
    const variants: any = {
        indigo: "border-indigo-500 text-indigo-700 bg-indigo-50/50",
        emerald: "border-emerald-500 text-emerald-700 bg-emerald-50/50",
        amber: "border-amber-500 text-amber-700 bg-amber-50/50"
    };

    return (
        <div className={`p-8 bg-white rounded-[40px] border-l-[12px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-t border-r border-b border-slate-100 ${variants[color]}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</span>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            </div>
            <div className={`text-4xl font-black tracking-tighter mb-2 ${isNumber ? 'text-slate-900' : ''}`}>
                {value}
            </div>
            <p className="text-sm font-bold opacity-50 italic">{desc}</p>
        </div>
    );
}

export default Dashboard;
