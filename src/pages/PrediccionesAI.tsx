import React, { useEffect, useState } from "react";
import API from "../api/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import * as XLSX from 'xlsx';

function PrediccionesAI() {
  const [tendenciaGeneral, setTendenciaGeneral] = useState<any[]>([]);
  const [rankingIA, setRankingIA] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/ai/predicciones");
      setTendenciaGeneral(res.data.tendenciaGeneral);
      setRankingIA(res.data.analisisInteligente);
      setResumen(res.data.resumenEjecutivo);
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
          <p className="text-sky-400 font-medium text-[10px] uppercase tracking-widest mb-3">{label}</p>
          <div className="space-y-2">
              {payload.map((entry: any, index: number) => {
                if (entry.value === 0) return null;
                return (
                  <div key={index} className="flex items-center justify-between gap-6">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{entry.name}:</span>
                      <span className="text-sm font-medium text-white">{entry.value} uds.</span>
                  </div>
                )
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  }

  const handleDownloadReport = () => {
    // 1. Filtrar solo productos que necesitan reabastecimiento (faltante > 0)
    const criticalProducts = rankingIA.filter(p => p.faltante > 0);
    
    if (criticalProducts.length === 0) {
      alert("No hay productos sugeridos para reabastecer en este momento.");
      return;
    }

    // 2. Preparar los datos para Excel de forma estructurada
    const excelData = criticalProducts.map(p => ({
      "PRODUCTO": p.nombre,
      "CATEGORÍA": p.categoria,
      "CLASIFICACIÓN ABC": p.clase_abc,
      "STOCK ACTUAL": p.stock_disponible,
      "CANTIDAD A PEDIR": p.faltante,
      "PROVEEDOR SUGERIDO": p.proveedor_sugerido,
      "IMPORTE PROYECTADO": formatCurrency(p.oportunidad_venta_usd),
      "ESTADO": p.status
    }));

    // 3. Crear el libro de Excel (Workbook)
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos Sugeridos IA");

    // 4. Mejorar usabilidad: Ajuste automático de anchos de columna
    const columnWidths = [
      { wch: 40 }, // Producto
      { wch: 20 }, // Categoría
      { wch: 15 }, // ABC
      { wch: 15 }, // Stock
      { wch: 20 }, // Cantidad
      { wch: 30 }, // Proveedor
      { wch: 20 }, // Importe
      { wch: 20 }  // Estado
    ];
    worksheet['!cols'] = columnWidths;

    // 5. Activar AutoFiltros para el usuario final
    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:H1");
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // 6. Descargar el archivo .xlsx (Formato profesional)
    XLSX.writeFile(workbook, `PEDIDOS_SUGERIDOS_IA_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-1000 pb-20 px-4">
      
      {/* AI Header Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-8 md:p-12 mb-12 border border-slate-800 shadow-2xl group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-medium text-sky-400 uppercase tracking-widest">Neural Engine Multi-Tenant v4.2</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tighter leading-none mb-2 italic">
                    Inteligencia <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 not-italic uppercase font-bold">Predictiva ERP</span>
                </h1>
                <p className="text-slate-400 font-medium text-sm md:text-md max-w-xl italic opacity-80">
                    Genere reportes profesionales de Excel con un solo clic. Datos estructurados para su departamento de compras.
                </p>
                <div className="flex gap-4">
                    <button 
                    onClick={handleDownloadReport}
                    className="mt-4 px-8 py-3.5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-sky-50 hover:text-sky-700 active:scale-95 flex items-center gap-3 group"
                    >
                    <span className="group-hover:animate-bounce">📊</span> Exportar Excel Profesional (.xlsx)
                    </button>
                    
                    <div className="mt-4 px-6 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl text-[9px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Auto-Format Activo
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10 text-center">
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mb-1">Potencial de Venta</span>
                    <div className="text-indigo-300 font-medium text-xl">
                        {resumen ? formatCurrency(resumen.potencialIngresosProximoMes) : '$0'}
                    </div>
                </div>
                <div className="bg-emerald-500/10 backdrop-blur-md p-6 rounded-[32px] border border-emerald-500/20 text-center">
                    <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-widest block mb-1">Estado de Datos</span>
                    <div className="text-emerald-400 font-medium text-xl italic uppercase tracking-tighter">
                        Privado
                    </div>
                </div>
            </div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {loading ? (
        <div className="py-40 text-center flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-2 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-medium text-slate-900 tracking-tight uppercase italic opacity-60">Optimizando Reporte...</h2>
        </div>
      ) : (
        <div className="space-y-12">
          
          <div className="bg-white p-6 md:p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div className="space-y-1">
                    <h2 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span> Análisis Macro de Rotación
                    </h2>
                    <p className="text-slate-400 font-medium text-[9px] uppercase tracking-widest pl-4 opacity-70">Tendencia de Unidades Vendidas</p>
                </div>
             </div>

             <div className="h-[400px] w-full">
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
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={9} fontWeight={500} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight={500} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                    <Area type="monotone" dataKey="real" name="Histórico" stroke="#6366f1" strokeWidth={4} fill="url(#colorReal)" animationDuration={1500} />
                    <Area type="monotone" dataKey="proyectado" name="Predicción" stroke="#0ea5e9" strokeWidth={3} strokeDasharray="8 8" fill="url(#colorPredict)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="mb-10 space-y-2">
                <h2 className="text-2xl font-medium text-slate-900 tracking-tight italic">
                    Inteligencia de Abastecimiento (Pareto)
                </h2>
                <p className="text-slate-500 font-medium text-sm opacity-80">
                    Clasificamos tus productos mediante Análisis ABC para priorizar inversiones y capital.
                </p>
            </div>

            {rankingIA.length === 0 ? (
                <div className="py-24 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px] italic">Datos insuficientes. Registra más ventas.</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-8 md:-mx-12">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 md:px-12 py-4">Producto / Categoria</th>
                                <th className="px-6 py-4 text-center">Proveedor Sugerido</th>
                                <th className="px-6 py-4 text-center">ABC</th>
                                <th className="px-6 py-4 text-center">Stock</th>
                                <th className="px-8 py-4 text-right">Demanda Proyectada</th>
                                <th className="px-8 md:px-12 py-4 text-right">Impacto Fin.</th>
                                <th className="px-8 md:px-12 py-4 text-right">Estado AI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rankingIA.map((prod) => (
                                <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 md:px-12 py-4">
                                        <div className="font-medium text-slate-900 uppercase tracking-tight text-xs">{prod.nombre}</div>
                                        <div className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">{prod.categoria}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg inline-block max-w-[150px] truncate">
                                            {prod.proveedor_sugerido}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-medium uppercase tracking-widest ${
                                            prod.clase_abc.startsWith('A') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                            prod.clase_abc.startsWith('B') ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                            {prod.clase_abc}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`text-sm font-medium ${prod.stock_disponible < prod.proyeccion_demanda ? 'text-rose-500' : 'text-slate-900'}`}>
                                            {prod.stock_disponible}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right font-medium text-indigo-700 text-sm">
                                        {prod.proyeccion_demanda} uds.
                                    </td>
                                    <td className="px-8 md:px-12 py-4 text-right font-medium text-slate-600 text-[11px]">
                                        {formatCurrency(prod.oportunidad_venta_usd)}
                                    </td>
                                    <td className="px-8 md:px-12 py-4 text-right">
                                        <div className={`inline-flex px-3 py-1 rounded-xl text-[8px] font-medium uppercase tracking-widest border ${
                                            prod.status.includes('REABASTECER') ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                                            prod.status.includes('EXCESO') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            prod.status.includes('MUERTO') ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {prod.status}
                                        </div>
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
