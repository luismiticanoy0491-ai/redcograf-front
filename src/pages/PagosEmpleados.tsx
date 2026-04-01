import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function PagosEmpleados() {
  const [ nomina, setNomina ] = useState([]);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(null);
  
  const currentDate = new Date();
  const [ mes, setMes ] = useState(currentDate.getMonth() + 1); // 1 to 12
  const [ anio, setAnio ] = useState(currentDate.getFullYear());

  const [ ticketData, setTicketData ] = useState(null);

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
    } catch (err) {
      console.error(err);
      setError("No pudimos conectar con el servidor para calcular la nómina. Verifica tu conexión o reinicia el sistema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNomina();
  }, [mes, anio]);

  useEffect(() => {
    if (ticketData) {
      setTimeout(() => {
        window.print();
        setTicketData(null);
      }, 300);
    }
  }, [ticketData]);

  const handlePagar = async (empleado) => {
    if (!window.confirm(`¿Confirmas el pago a ${empleado.nombre} por un total de ${formatCOP(empleado.total_a_pagar)}?`)) return;

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
      alert("✅ Pago registrado satisfactoriamente.");
      
      // Imprimir el soporte justo despues de pagar
      setTicketData({
        ...empleado,
        mesLabel: meses.find(m => m.value === parseInt(mes.toString()))?.label || "",
        anio,
        fecha_pago: new Date().toISOString()
      });

      fetchNomina();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al registrar el pago.");
    }
  };

  const handleReimprimirSoporte = (empleado) => {
     setTicketData({
        ...empleado,
        mesLabel: meses.find(m => m.value === parseInt(mes.toString()))?.label || "",
        anio
      });
  };

  const totalNominaCalculada = nomina.reduce((acc, emp) => acc + emp.total_a_pagar, 0);

  return (
    <div className="fade-in">
      <div className="no-print header-section">
        <h2>Administración de Pagos (Nómina)</h2>
        <p>Calcula dinámicamente el salario y comisiones según las ventas mensuales.</p>
      </div>

      <div className="no-print grid-container" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 3fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* PANEL IZQUIERDO: FILTROS */}
        <div className="card form-card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Filtro de Periodo</h3>
          
          <div className="form-group">
            <label>Mes de Trabajo</label>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: '0.75rem', fontSize: '1.05rem', width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Año Fiscal</label>
            <input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} min="2020" max="2100" style={{ padding: '0.75rem', fontSize: '1.05rem', width: '100%' }} />
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>Gran Total de Nómina (Proyectado)</span>
            <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: '900', color: '#0f172a' }}>{formatCOP(totalNominaCalculada)}</span>
          </div>
        </div>

        {/* PANEL DERECHO: TABLA */}
        <div className="card table-card" style={{ overflowX: 'auto', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '1rem' }}>Planilla de Liquidación ({nomina.length} empleados)</h3>
          
          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', borderRadius: '4px' }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Calculando comisiones...</p>
          ) : (
            <table className="modern-table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Salario Base</th>
                  <th>Ventas (Mes)</th>
                  <th>Comisiones Ganadas</th>
                  <th>Gran Total</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nomina.map((emp) => (
                  <tr key={emp.cajero_id} className="row-hover">
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{emp.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Doc: {emp.documento || "N/A"}</div>
                    </td>
                    <td style={{ color: '#475569' }}>{formatCOP(emp.salario_base)}</td>
                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{formatCOP(emp.total_ventas)}</td>
                    <td>
                       <div style={{ fontWeight: 'bold', color: emp.comisiones > 0 ? '#16a34a' : '#64748b' }}>{formatCOP(emp.comisiones)}</div>
                       {emp.porcentaje_comision > 0 && <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Aplica {emp.porcentaje_comision}%</div>}
                    </td>
                    <td style={{ fontWeight: '900', color: '#0369a1', fontSize: '1.1rem' }}>{formatCOP(emp.total_a_pagar)}</td>
                    <td style={{ textAlign: 'center' }}>
                       {emp.estado === "Pagado" ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>✅ Pagado</span>
                       ) : (
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>⏳ Pendiente</span>
                       )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                       {emp.estado === "Pagado" ? (
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleReimprimirSoporte(emp)}>🖨️ Soporte</button>
                       ) : (
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handlePagar(emp)}>💰 Pagar</button>
                       )}
                    </td>
                  </tr>
                ))}
                {nomina.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '3rem', color: '#64748b' }}>
                       Aún no tienes personal registrado en la sección "Cajeros y Personal". Agrega tus empleados primero.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* COMPROBANTE IMPRIMIBLE OCULTO (solo se muestra al hacer ctrl+p o disparar window.print) */}
      {ticketData && (
         <div className="printable-receipt print-only fade-in">
            <div className="receipt-header" style={{ marginBottom: '1rem', textAlign: 'center' }}>
               <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'black' }}>TIENDA POS</h2>
               <p style={{ margin: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>COMPROBANTE DE PAGO DE NÓMINA</p>
               <p style={{ margin: 0, fontSize: '12px' }}>Periodo: {ticketData.mesLabel} {ticketData.anio}</p>
               <p style={{ margin: 0, fontSize: '12px' }}>Fecha Impresión: {new Date().toLocaleString()}</p>
            </div>

            <div style={{ fontSize: '12px', margin: '15px 0' }}>
               <p><strong>Empleado:</strong> {ticketData.nombre}</p>
               <p><strong>Identificación:</strong> {ticketData.documento || 'N/A'}</p>
            </div>

            <table style={{ width: '100%', fontSize: '12px', marginBottom: '1rem', borderCollapse: 'collapse' }}>
               <thead style={{ borderBottom: '1px dashed black', borderTop: '1px dashed black' }}>
                 <tr>
                   <th style={{ textAlign: 'left', padding: '4px 0' }}>Concepto</th>
                   <th style={{ textAlign: 'right', padding: '4px 0' }}>Valor</th>
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td style={{ padding: '4px 0' }}>Salario Base</td>
                   <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCOP(ticketData.salario_base)}</td>
                 </tr>
                 <tr>
                   <td style={{ padding: '4px 0' }}>Comisiones por Ventas ({ticketData.porcentaje_comision}%)</td>
                   <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCOP(ticketData.comisiones)}</td>
                 </tr>
               </tbody>
            </table>

            <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginTop: '10px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                 <span>TOTAL PAGADO:</span>
                 <span>{formatCOP(ticketData.total_a_pagar)}</span>
               </div>
            </div>

            <div className="print-only" style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '12px' }}>
               <p>___________________________________</p>
               <p>Firma de Recibido Conformidad</p>
               <p>{ticketData.nombre}</p>
               <br/>
               <p style={{ fontSize: '10px' }}>Documento oficial de liquidación laboral.</p>
            </div>
         </div>
      )}

    </div>
  );
}

export default PagosEmpleados;
