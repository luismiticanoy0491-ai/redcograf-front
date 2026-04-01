import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

interface Producto {
  id: number;
  nombre: string;
  referencia: string;
  precio_venta: number;
  cantidad: number;
}

interface Cliente {
  id: number;
  nombre: string;
  documento: string;
}

export default function Separados() {
  const [separados, setSeparados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [termSeparado, setTermSeparado] = useState("");

  // For New Separado
  const [showNewModal, setShowNewModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const [empresa, setEmpresa] = useState<any>({});
  const [facturaPrintData, setFacturaPrintData] = useState<{cabecera: any, detalles: any[]} | null>(null);
  const [separadoPrintData, setSeparadoPrintData] = useState<{separado: any, abonos: any[]} | null>(null);

  // Las impresiones se manejan en las funciones correspondientes para evitar que useEffect elimine los datos y cause vistas en blanco.
  
  const [newClienteId, setNewClienteId] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [initialPayment, setInitialPayment] = useState("");

  // For View/Abonar
  const [viewSeparado, setViewSeparado] = useState<any>(null);
  const [viewAbonos, setViewAbonos] = useState<any[]>([]);
  const [abonoInput, setAbonoInput] = useState("");

  const [cajeros, setCajeros] = useState<any[]>([]);
  const [cajeroId, setCajeroId] = useState("");

  useEffect(() => {
    fetchSeparados();
    API.get("/clientes").then(res => setClientes(res.data)).catch(console.error);
    API.get("/productos").then(res => setProductos(res.data)).catch(console.error);
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
    API.get("/empresa").then(res => setEmpresa(res.data)).catch(console.error);
  }, []);

  const fetchSeparados = () => {
    setLoading(true);
    API.get("/separados")
      .then(res => { setSeparados(res.data); setLoading(false); })
      .catch(console.error);
  };

  const handleCreate = async () => {
    if (!newClienteId) return alert("Selecciona un cliente");
    if (cart.length === 0) return alert("Agrega al menos un producto");
    
    const total = cart.reduce((acc, c) => acc + (c.precio_venta * c.qty), 0);
    const abono = parseFloat(initialPayment) || 0;
    
    if (abono > total) return alert("El abono inicial no puede ser mayor al total");

    try {
      await API.post("/separados", {
        cliente_id: parseInt(newClienteId),
        detalles: cart,
        total,
        abono_inicial: abono
      });
      alert("✅ Separado creado exitosamente");
      setShowNewModal(false);
      setCart([]);
      setNewClienteId("");
      setInitialPayment("");
      fetchSeparados();
    } catch (error) {
      console.error(error);
      alert("Error al crear el separado");
    }
  };

  const addProdToCart = (prod: Producto) => {
    const exist = cart.find(x => x.id === prod.id);
    if (exist) {
      setCart(cart.map(x => x.id === prod.id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...prod, qty: 1 }]);
    }
    setProdSearch("");
  };

  const openView = (id: number) => {
    API.get(`/separados/${id}`)
      .then(res => {
        setViewSeparado(res.data.separado);
        setViewAbonos(res.data.abonos);
        setAbonoInput("");
      })
      .catch(console.error);
  };

  const handleAbonar = async () => {
    const abono = parseFloat(abonoInput);
    if (!abono || abono <= 0) return alert("Ingresa un abono válido");
    if (abono > viewSeparado.saldo_pendiente) return alert("El abono no puede superar el saldo pendiente");

    try {
      await API.post(`/separados/${viewSeparado.id}/abonos`, { monto: abono });
      alert("Abono registrado");
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al abonar");
    }
  };

  const handleCompletar = async () => {
    if (!cajeroId) return alert("Selecciona el cajero vendedor");
    try {
      const resp = await API.put(`/separados/${viewSeparado.id}/completar`, { cajero_id: parseInt(cajeroId) });
      alert("✅ Venta Completada exitosamente y descontado de inventario");
      
      if (window.confirm("¿Desea imprimir la tirilla de pago?")) {
        API.get(`/ventas/${resp.data.factura_id}`)
          .then(resVentas => {
            const cajeroName = cajeros.find(c => c.id.toString() === cajeroId)?.nombre || "Principal";
            setFacturaPrintData({
              cabecera: {
                id: resp.data.factura_id,
                cliente: viewSeparado.cliente_nombre || "Casual",
                fecha: new Date().toISOString(),
                total: viewSeparado.total,
                metodo_pago: "Efectivo",
                cajero: cajeroName
              },
              detalles: resVentas.data
            });
            setTimeout(() => window.print(), 500);
          })
          .catch(console.error);
      }
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al completar venta");
    }
  };

  const handleAnular = async () => {
    if (!window.confirm("¿Estás seguro de anular este separado?")) return;
    try {
      await API.put(`/separados/${viewSeparado.id}/anular`);
      alert("Separado anulado");
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al anular");
    }
  };

  const handlePrintSeparado = () => {
    setSeparadoPrintData({separado: viewSeparado, abonos: viewAbonos});
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredSeparados = separados.filter(s => {
    const term = termSeparado.toLowerCase();
    const isIdMatch = s.id.toString().includes(term);
    const isNameMatch = s.cliente_nombre && s.cliente_nombre.toLowerCase().includes(term);
    const isDocMatch = s.cliente_documento && s.cliente_documento.toLowerCase().includes(term);
    return isIdMatch || isNameMatch || isDocMatch;
  });

  return (
    <div className="fade-in" style={{ padding: '2rem' }}>
      <div className="no-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
         <div>
            <h1>🛒 Gestión de Separados</h1>
            <p>Separa productos para clientes y gestiona sus abonos parciales hasta la liquidación.</p>
         </div>
         <button className="btn-primary" onClick={() => setShowNewModal(true)}>+ Nuevo Separado</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar separado por cliente (#ID, Nombre o Documento)..." 
          value={termSeparado} 
          onChange={e => setTermSeparado(e.target.value)} 
          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
        />
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {loading ? <p>Cargando separados...</p> : (
          <table className="modern-table" style={{ width: '100%', textAlign: 'left' }}>
             <thead>
                <tr>
                   <th>ID</th>
                   <th>Cliente</th>
                   <th>Fecha</th>
                   <th>Total</th>
                   <th>Saldo Pend.</th>
                   <th>Estado</th>
                   <th>Acción</th>
                </tr>
             </thead>
             <tbody>
               {filteredSeparados.map(s => (
                 <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.cliente_nombre || "Desconocido"}</td>
                    <td>{new Date(s.fecha_creacion).toLocaleDateString()}</td>
                    <td>{formatCOP(s.total)}</td>
                    <td style={{ fontWeight: 'bold', color: parseFloat(s.saldo_pendiente) > 0 ? '#ef4444' : '#10b981' }}>{formatCOP(s.saldo_pendiente)}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                        background: s.estado === 'Pendiente' ? '#fef08a' : (s.estado === 'Pagado' ? '#bbf7d0' : '#fecaca'),
                        color: s.estado === 'Pendiente' ? '#a16207' : (s.estado === 'Pagado' ? '#166534' : '#991b1b')
                      }}>
                         {s.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => openView(s.id)}>Ver / Gestionar</button>
                     </td>
                 </tr>
               ))}
               {filteredSeparados.length === 0 && !loading && <tr><td colSpan={7} style={{textAlign: 'center', padding: '1.5rem', color: '#64748b'}}>No hay separados registrados que coincidan con la búsqueda.</td></tr>}
               {separados.length === 0 && loading && <tr><td colSpan={7} style={{textAlign: 'center', padding: '1.5rem', color: '#64748b'}}>Cargando...</td></tr>}
             </tbody>
          </table>
        )}
      </div>

      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '700px' }}>
            <h2>🛒 Crear Nuevo Separado</h2>
            
            <div style={{ marginTop: '1rem' }}>
               <label>Cliente</label>
               {newClienteId ? (
                 <div style={{ padding: '0.5rem', border: '1px solid #10b981', background: '#ecfdf5', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span>{clientes.find(c => c.id.toString() === newClienteId)?.nombre} | DOC: {clientes.find(c => c.id.toString() === newClienteId)?.documento || 'N/A'}</span>
                    <button onClick={() => setNewClienteId("")} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                 </div>
               ) : (
                 <>
                   <input type="text" value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} placeholder="Buscar cliente por nombre o documento..." style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} />
                   {clienteSearch && (
                     <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', marginTop: '-10px', marginBottom: '1rem' }}>
                        {clientes.filter(c => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || (c.documento && c.documento.includes(clienteSearch))).slice(0, 10).map(c => (
                           <div key={c.id} onClick={() => { setNewClienteId(c.id.toString()); setClienteSearch(""); }} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                              {c.nombre} {c.documento ? `(DOC: ${c.documento})` : ''}
                           </div>
                        ))}
                        {clientes.filter(c => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || (c.documento && c.documento.includes(clienteSearch))).length === 0 && (
                          <div style={{ padding: '0.5rem', color: '#666' }}>No se encontraron clientes</div>
                        )}
                     </div>
                   )}
                 </>
               )}
            </div>

            <div style={{ marginBottom: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
               <label>Buscar Producto para Separar</label>
               <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Ref o Nombre..." style={{ width: '100%', padding: '0.5rem' }} />
               {prodSearch && (
                 <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', marginTop: '5px' }}>
                    {productos.filter(p => p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || p.referencia.toLowerCase().includes(prodSearch.toLowerCase())).slice(0, 10).map(p => (
                       <div key={p.id} onClick={() => addProdToCart(p)} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                          {p.nombre} ({p.referencia}) - {formatCOP(p.precio_venta)} - Disp: {p.cantidad}
                       </div>
                    ))}
                 </div>
               )}
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
               {cart.length > 0 ? cart.map((c, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', marginBottom: '0.5rem' }}>
                    <span>x{c.qty} {c.nombre}</span>
                    <span>{formatCOP(c.precio_venta * c.qty)}</span>
                 </div>
               )) : <p>No hay productos en lista.</p>}
            </div>

            <div style={{ borderTop: '2px solid #ddd', paddingTop: '1rem', marginBottom: '1.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>
               Total: {formatCOP(cart.reduce((a,c) => a + c.precio_venta*c.qty, 0))}
            </div>

            <div>
               <label>Abono Inicial (Opcional)</label>
               <input type="number" value={initialPayment} onChange={e => setInitialPayment(e.target.value)} placeholder="Ej. 50000" style={{ width: '100%', padding: '0.5rem', marginBottom: '1.5rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewModal(false)}>Cancelar</button>
               <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Registrar Separado</button>
            </div>
          </div>
        </div>
      )}

      {viewSeparado && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Separado #{viewSeparado.id}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
               <span><strong>Estado:</strong> {viewSeparado.estado}</span>
               <span><strong>Fecha:</strong> {new Date(viewSeparado.fecha_creacion).toLocaleDateString()}</span>
            </div>

            <h4 style={{ marginBottom: '0.5rem' }}>Productos Separados:</h4>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
               {(() => {
                  const items = typeof viewSeparado.detalles_json === 'string' ? JSON.parse(viewSeparado.detalles_json) : viewSeparado.detalles_json;
                  return items.map((itm: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #e2e8f0' }}>
                       <span>{itm.qty || itm.cantidad}x {itm.nombre}</span>
                       <span>{formatCOP(itm.precio_venta * (itm.qty || itm.cantidad))}</span>
                    </div>
                  ));
               })()}
               <div style={{ textAlign: 'right', marginTop: '0.5rem', fontWeight: 'bold' }}>Total: {formatCOP(viewSeparado.total)}</div>
            </div>

            <h4 style={{ marginBottom: '0.5rem' }}>Historial de Abonos:</h4>
            {viewAbonos.length > 0 ? (
              <table style={{ width: '100%', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                 <tbody>
                    {viewAbonos.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                         <td style={{ padding: '0.3rem 0' }}>{new Date(a.fecha_abono).toLocaleDateString()}</td>
                         <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>+{formatCOP(a.monto)}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            ) : <p style={{ fontSize: '0.9rem' }}>No hay abonos registrados todavía.</p>}

            {/* SECCION ABONAR / COMPLETAR */}
            {viewSeparado.estado === 'Pendiente' && parseFloat(viewSeparado.saldo_pendiente) > 0 && (
              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                 <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1e3a8a' }}>Saldo por Pagar: {formatCOP(viewSeparado.saldo_pendiente)}</p>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input type="number" placeholder="Monto a abonar" value={abonoInput} onChange={e => setAbonoInput(e.target.value)} style={{ flex: 1, padding: '0.5rem' }} />
                   <button className="btn-primary" onClick={handleAbonar}>Registrar Abono</button>
                 </div>
              </div>
            )}

            {viewSeparado.estado === 'Pendiente' && parseFloat(viewSeparado.saldo_pendiente) <= 0 && (
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                 <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#166534' }}>¡Saldo Completado! Registra y entrega de inventario.</p>
                 <select value={cajeroId} onChange={e => setCajeroId(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}>
                    <option value="">-- Seleccionar Cajero Autorizado --</option>
                    {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                 </select>
                 <button className="btn-primary" style={{ width: '100%', background: '#10b981' }} onClick={handleCompletar}>Completar Venta y Entregar Mercancía</button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
               {viewSeparado.estado === 'Pendiente' ? (
                  <button onClick={handleAnular} style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer' }}>Anular Separado</button>
               ) : <div/>}
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="btn-primary" style={{ backgroundColor: '#0f172a', border: 'none' }} onClick={handlePrintSeparado}>
                   🖨️ Imprimir Recibo
                 </button>
                 <button className="btn-secondary" onClick={() => setViewSeparado(null)}>Cerrar</button>
               </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {facturaPrintData && (
        <div className="printable-receipt print-only" style={{fontFamily: 'monospace', color: 'black'}}>
          <div className="receipt-header print-only" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{empresa.nombre_empresa || "MI EMPRESA"}</h2>
            <h4 style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>RECIBO DE CAJA VOLANTE</h4>
            {empresa.nit && <p style={{ fontSize: '0.9rem', margin: '0' }}>NIT: {empresa.nit}</p>}
            <p style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold' }}>No responsable de IVA</p>
            {empresa.direccion && <p style={{ fontSize: '0.85rem', margin: '0' }}>Dir: {empresa.direccion}</p>}
            <p style={{ fontSize: '0.85rem', margin: '0' }}>
               {empresa.telefono && <span>Cel: {empresa.telefono}</span>}
               {empresa.telefono && empresa.correo && <span> | </span>}
               {empresa.correo && <span>Correo: {empresa.correo}</span>}
            </p>
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
            <p style={{ fontSize: '0.9rem', margin: '0' }}>Ticket No. {facturaPrintData.cabecera.id}</p>
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
          </div>
          
          <table style={{ width: '100%', fontSize: '12px', marginBottom: '1rem', borderCollapse: 'collapse' }}>
            <thead style={{ borderBottom: '1px dashed black', borderTop: '1px dashed black' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Cant</th>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Itm</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {facturaPrintData.detalles.map((d: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: '4px 0', verticalAlign: 'top' }}>{d.cantidad}</td>
                  <td style={{ padding: '4px 0' }}>
                     <div>{d.nombre}</div>
                     {d.referencia && <div style={{fontSize: '10px'}}>{d.referencia}</div>}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 0', verticalAlign: 'top' }}>{formatCOP(d.cantidad * d.precio_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="print-only">------------------------------------</p>

          <div style={{ paddingTop: '5px', marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
              <span>TOTAL:</span>
              <span>{formatCOP(facturaPrintData.cabecera.total)}</span>
            </div>
            
            <div className="print-only" style={{ marginTop: '1.5rem', fontSize: '12px', textAlign: 'left' }}>
              <p style={{ margin: '4px 0' }}><strong>Fecha Original:</strong> {new Date(facturaPrintData.cabecera.fecha).toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>Forma de pago:</strong> {facturaPrintData.cabecera.metodo_pago}</p>
              <p style={{ margin: '4px 0' }}><strong>Cliente:</strong> {facturaPrintData.cabecera.cliente || "Casual"}</p>
              <p style={{ margin: '4px 0' }}><strong>Cajero Vendedor:</strong> {facturaPrintData.cabecera.cajero || "Principal"}</p>
              
              <div style={{ margin: '15px 0 5px 0', borderTop: '1px dashed #ccc', paddingTop: '10px', whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: '11px' }}>
                {empresa.resolucion || "Resolución DIAN Autorizada"}
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>¡Gracias por su compra!</p>
            </div>
          </div>
        </div>
      )}
      
      {separadoPrintData && (
        <div className="printable-receipt print-only" style={{fontFamily: 'monospace', color: 'black'}}>
          <div className="receipt-header print-only" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{empresa.nombre_empresa || "MI EMPRESA"}</h2>
            <h4 style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>ESTADO DE SEPARADO</h4>
            {empresa.nit && <p style={{ fontSize: '0.9rem', margin: '0' }}>NIT: {empresa.nit}</p>}
            {empresa.direccion && <p style={{ fontSize: '0.85rem', margin: '0' }}>Dir: {empresa.direccion}</p>}
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
            <p style={{ fontSize: '0.9rem', margin: '0' }}>Separado No. {separadoPrintData.separado.id}</p>
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '1rem' }}>
            <p style={{ margin: '4px 0' }}><strong>Cliente:</strong> {separadoPrintData.separado.cliente_nombre || "Casual"} {separadoPrintData.separado.cliente_documento ? `(${separadoPrintData.separado.cliente_documento})` : ''}</p>
            <p style={{ margin: '4px 0' }}><strong>Fecha Inicio:</strong> {new Date(separadoPrintData.separado.fecha_creacion).toLocaleString()}</p>
            <p style={{ margin: '4px 0' }}><strong>Estado Local:</strong> {separadoPrintData.separado.estado}</p>
          </div>

          <p style={{ margin: '0.5rem 0', fontSize: '12px', fontWeight: 'bold' }}>PRODUCTOS SEPARADOS</p>
          <table style={{ width: '100%', fontSize: '12px', marginBottom: '1rem', borderCollapse: 'collapse' }}>
            <thead style={{ borderBottom: '1px dashed black', borderTop: '1px dashed black' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Cant</th>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Itm</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Sub</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const items = typeof separadoPrintData.separado.detalles_json === 'string' ? JSON.parse(separadoPrintData.separado.detalles_json) : separadoPrintData.separado.detalles_json;
                return items.map((itm: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>{itm.qty || itm.cantidad}</td>
                    <td style={{ padding: '4px 0' }}>
                        <div>{itm.nombre}</div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '4px 0', verticalAlign: 'top' }}>{formatCOP(itm.precio_venta * (itm.qty || itm.cantidad))}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
            <span>TOTAL SEPARADO:</span>
            <span>{formatCOP(separadoPrintData.separado.total)}</span>
          </div>

          <p style={{ margin: '0.5rem 0', fontSize: '12px', fontWeight: 'bold', borderTop: '1px dashed black', paddingTop: '5px' }}>HISTORIAL DE ABONOS</p>
          {separadoPrintData.abonos.length > 0 ? (
            <table style={{ width: '100%', fontSize: '12px', marginBottom: '1rem', borderCollapse: 'collapse' }}>
              <tbody>
                {separadoPrintData.abonos.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ padding: '2px 0' }}>{new Date(a.fecha_abono).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>+{formatCOP(a.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '12px', marginBottom: '1rem' }}>Sin historial de abonos.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', borderTop: '1px dashed black', paddingTop: '5px', marginBottom: '5px' }}>
            <span>TOTAL PAGADO:</span>
            <span>{formatCOP(parseFloat(separadoPrintData.separado.total) - parseFloat(separadoPrintData.separado.saldo_pendiente))}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '1px dashed black', paddingTop: '5px' }}>
            <span>SALDO PENDIENTE:</span>
            <span>{formatCOP(separadoPrintData.separado.saldo_pendiente)}</span>
          </div>
          
          <div className="print-only" style={{ marginTop: '1.5rem', fontSize: '11px', textAlign: 'center' }}>
            <p>¡Gracias por su separación!</p>
            <p>Por favor conserve este recibo para cualquier reclamo o para realizar los siguientes abonos.</p>
          </div>
        </div>
      )}

    </div>
  );
}
