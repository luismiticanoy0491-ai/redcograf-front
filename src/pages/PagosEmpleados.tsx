import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function PagosEmpleados() {
  const [ nomina, setNomina ] = useState<any[]>([]);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);
  
  const currentDate = new Date();
  const [ mes, setMes ] = useState(currentDate.getMonth() + 1);
  const [ anio, setAnio ] = useState(currentDate.getFullYear());

  const [ ticketData, setTicketData ] = useState<any>(null);

  const meses = [
    { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
    { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" }
  ];

  const fetchNomina = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/pagos?mes=${mes}&anio=${anio}`);
      setNomina(res.data);
    } catch (err: any) {
      console.error("Payroll Fetch Error:", err);
      const msg = err.response?.data?.error || err.message || "Error desconocido";
      setError(`Fallo de conexión: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNomina();
  }, [mes, anio]);

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  useEffect(() => {
    if (ticketData) {
      setTimeout(() => {
        reactToPrintFn();
      }, 200);
    }
  }, [ticketData, reactToPrintFn]);

  const handlePagar = async (empleado: any) => {
    if (!window.confirm(`¿Confirmar pago a ${empleado.nombre} por ${formatCOP(empleado.total_a_pagar)}?`)) return;

    try {
      await API.post("/pagos", {
        cajero_id: empleado.cajero_id,
        mes,
        anio,
        salario_base: empleado.salario_base,
        comisiones: empleado.comisiones,
        total_pagado: empleado.total_a_pagar,
        metodo_pago: "Efectivo"
      });
      
      setTicketData({
        ...empleado,
        mesLabel: meses.find(m => m.value === parseInt(mes.toString()))?.label || "",
        anio,
        fecha_pago: new Date().toISOString()
      });

      fetchNomina();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al registrar el pago.");
    }
  };

  const handleReimprimirSoporte = (empleado: any) => {
     setTicketData({
        ...empleado,
        mesLabel: meses.find(m => m.value === parseInt(mes.toString()))?.label || "",
        anio
      });
  };

  const totalNominaCalculada = nomina.reduce((acc, emp) => acc + emp.total_a_pagar, 0);

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      <div className="no-print space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200">
            <div className="space-y-1">
                <h1 className="text-4xl font-medium tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    Nómina y Comisiones
                </h1>
                <p className="text-slate-500 font-medium text-lg italic">Liquidación mensual de salarios fijos y bonificaciones por ventas.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            
            {/* Control Sidebar */}
            <div className="xl:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                    <h3 className="text-xl font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Periodo Fiscal
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Mes de Operación</label>
                            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all">
                                {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Año</label>
                            <input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all" />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <div className="p-6 bg-slate-950 rounded-3xl relative overflow-hidden group">
                            <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-widest mb-2 block relative z-10">Desembolso Proyectado</span>
                            <span className="text-3xl font-medium text-white tracking-tighter relative z-10">{formatCOP(totalNominaCalculada)}</span>
                            <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:scale-125 transition-transform duration-700">💸</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="xl:col-span-8">
                <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900 tracking-tight uppercase flex items-center gap-2">
                            <span className="w-2 h-6 bg-slate-900 rounded-full"></span> Planilla de Liquidación
                        </h3>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 py-1 bg-slate-50 rounded-full">{nomina.length} Empleados</span>
                    </div>

                    {error && (
                        <div className="m-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium animate-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-8 py-5">Colaborador</th>
                                    <th className="px-8 py-5 text-right">Devengado Fijo</th>
                                    <th className="px-8 py-5 text-right">Comisiones</th>
                                    <th className="px-8 py-5 text-right">Total Neto</th>
                                    <th className="px-8 py-5 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-medium uppercase text-[10px] tracking-widest">Calculando compensaciones...</td></tr>
                                ) : nomina.length === 0 ? (
                                    <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-medium italic opacity-50">No hay personal activo en este periodo.</td></tr>
                                ) : (
                                    nomina.map(emp => (
                                        <tr key={emp.cajero_id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-medium text-slate-900 uppercase leading-tight group-hover:text-indigo-600 transition-colors">{emp.nombre}</div>
                                                <div className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">ID: {emp.documento || "—"}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="font-medium text-slate-600 text-sm tracking-tight">{formatCOP(emp.salario_base)}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`font-medium text-sm ${emp.comisiones > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                    +{formatCOP(emp.comisiones)}
                                                </div>
                                                {emp.porcentaje_comision > 0 && <div className="text-[8px] font-medium text-emerald-400 uppercase">Efec. {emp.porcentaje_comision}%</div>}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="font-medium text-slate-900 text-lg tracking-tighter">{formatCOP(emp.total_a_pagar)}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {emp.estado === "Pagado" ? (
                                                    <button onClick={() => handleReimprimirSoporte(emp)} className="px-5 py-2 bg-slate-100 text-[10px] font-medium text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest border border-slate-200">🖨️ Re-Imprimir</button>
                                                ) : (
                                                    <button onClick={() => handlePagar(emp)} className="px-8 py-3 bg-indigo-600 text-[10px] font-medium text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all uppercase tracking-widest">💰 Pagar Salario</button>
                                                )}
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
      </div>

      <div style={{ display: 'none' }}>
        {ticketData && (
          <div ref={contentRef} className="w-[80mm] max-w-[300px] p-4 bg-white text-black font-sans box-border" style={{ margin: '0 auto' }}>
              <div className="text-center space-y-2 mb-3">
                  <h2 className="text-lg font-medium uppercase">Soporte de Pago</h2>
                  <div className="py-2 border-y border-dashed border-black my-2 text-xs font-medium uppercase">
                      Liquidación {ticketData.mesLabel} {ticketData.anio}
                  </div>
                  <p className="text-[10px] uppercase font-medium opacity-70">Fecha: {new Date().toLocaleString()}</p>
              </div>

              <div className="text-xs space-y-1 border-b border-dashed border-black pb-3 mb-3">
                  <p><strong>Colaborador:</strong> {ticketData.nombre}</p>
                  <p><strong>Documento:</strong> {ticketData.documento || '—'}</p>
              </div>

              <table className="w-full text-xs mb-3">
                  <thead>
                      <tr className="border-b border-black">
                          <th className="py-1 text-left uppercase">Concepto</th>
                          <th className="py-1 text-right uppercase">Valor</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="border-b border-dashed border-gray-300">
                          <td className="py-2 font-medium">Salario Base (<span className="uppercase">Contractual</span>)</td>
                          <td className="py-2 text-right font-medium">{formatCOP(ticketData.salario_base)}</td>
                      </tr>
                      <tr className="border-b border-dashed border-gray-300">
                          <td className="py-2 font-medium">Comisiones ({ticketData.porcentaje_comision}%)</td>
                          <td className="py-2 text-right font-medium text-emerald-700">+{formatCOP(ticketData.comisiones)}</td>
                      </tr>
                  </tbody>
              </table>

              <div className="pt-2 border-t border-black space-y-4">
                  <div className="flex justify-between font-medium text-sm mt-2">
                      <span>NETO PAGADO:</span>
                      <span>{formatCOP(ticketData.total_a_pagar)}</span>
                  </div>
                  
                  <div className="pt-10 flex flex-col items-center gap-1">
                      <div className="w-[80%] border-t border-black mb-1"></div>
                      <p className="text-[9px] font-medium uppercase">Firma de Conformidad</p>
                      <p className="text-[9px] uppercase font-medium">{ticketData.nombre}</p>
                  </div>
              </div>

              <p className="text-center text-[8px] pt-6 opacity-50 uppercase tracking-widest italic">Documento generado por ERP</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default PagosEmpleados;
