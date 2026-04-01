import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function FacturasCompra() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State for Editing
  const [editHeader, setEditHeader] = useState({ proveedor: "", numero_factura: "" });
  const [editProductos, setEditProductos] = useState([]);
  
  const [newProd, setNewProd] = useState({
    referencia: "", nombre: "", categoria: "Sin Categoría", cantidad: 1, precio_compra: "", porcentaje_ganancia: 40, precio_venta: ""
  });
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchFacturas();
  }, []);

  const fetchFacturas = async () => {
    try {
      const res = await API.get("/compras");
      setFacturas(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Desconocida";
    return new Date(fechaISO).toLocaleString();
  };

  const openModal = (factura) => {
    setSelectedFactura(factura);
    setIsEditing(false);
    setEditHeader({ proveedor: factura.proveedor || "", numero_factura: factura.numero_factura || "" });
    setEditProductos(JSON.parse(JSON.stringify(factura.datos_json))); // Clon profundo
  };

  const closeModal = () => {
    setSelectedFactura(null);
    setIsEditing(false);
  };

  // ---- Funciones de Edición ----
  const removeEditItem = (index) => {
    const list = [...editProductos];
    list.splice(index, 1);
    setEditProductos(list);
  };

  const handleEditItemChange = (index, field, value) => {
    const list = [...editProductos];
    list[index][field] = value;
    
    // Auto-calculos financieros
    if (field === "precio_compra" || field === "porcentaje_ganancia") {
      const costo = parseFloat(list[index].precio_compra) || 0;
      const ganancia = parseFloat(list[index].porcentaje_ganancia) || 0;
      list[index].precio_venta = costo + (costo * (ganancia / 100));
    }
    if (field === "precio_venta") {
      const costo = parseFloat(list[index].precio_compra) || 0;
      const venta = parseFloat(value) || 0;
      if (costo > 0) {
        list[index].porcentaje_ganancia = ((venta - costo) / costo) * 100;
      }
    }
    setEditProductos(list);
  };

  const buscarProductoPorReferencia = async (codigo) => {
    if (!codigo) return;
    try {
      const res = await API.get(`/productos/buscar/${encodeURIComponent(codigo)}`);
      if (res.data) {
        setNewProd({
          ...newProd,
          referencia: res.data.referencia || codigo,
          nombre: res.data.nombre,
          categoria: res.data.categoria,
          precio_compra: res.data.precio_compra,
          porcentaje_ganancia: res.data.porcentaje_ganancia,
          precio_venta: res.data.precio_venta
        });
        setScanMessage({ text: "✅ Producto Auto-completado", type: "success" });
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setScanMessage({ text: "⚠️ Código Nuevo. Digita su Información para registrarlo.", type: "error" });
      }
    }
  };

  const handleRefKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarProductoPorReferencia(newProd.referencia);
    }
  };

  const addNewProductToInvoice = () => {
    if (!newProd.nombre || newProd.precio_compra === "") return alert("Falta el nombre o costo del producto.");
    
    const prodListo = {
      ...newProd,
      cantidad: parseInt(newProd.cantidad.toString(), 10) || 1,
      precio_compra: parseFloat(newProd.precio_compra.toString()) || 0,
      porcentaje_ganancia: parseFloat(newProd.porcentaje_ganancia.toString()) || 0,
      precio_venta: parseFloat(newProd.precio_venta.toString()) || 0
    };
    
    // Calcular venta si no fue llenado
    if (prodListo.precio_venta === 0 && prodListo.precio_compra > 0) {
      prodListo.precio_venta = prodListo.precio_compra + (prodListo.precio_compra * (prodListo.porcentaje_ganancia / 100));
    }

    setEditProductos([prodListo, ...editProductos]);
    setNewProd({ referencia: "", nombre: "", categoria: "Sin Categoría", cantidad: 1, precio_compra: "", porcentaje_ganancia: 40, precio_venta: "" });
    setScanMessage({ text: "", type: "" });
  };

  const saveEditedInvoice = async () => {
    if (editProductos.length === 0) return alert("Una factura no puede estar vacía. Si deseas anularla, debes tener otra opción de anulación.");
    if (!window.confirm("⚠️ Modificar el pasado re-calculará todo el inventario de estos productos en tiempo real sumando o restando las diferencias. ¿Estás seguro?")) return;
    
    setIsSaving(true);
    try {
      const granTotal = editProductos.reduce((acc, curr) => acc + (parseFloat(curr.precio_compra) * parseFloat(curr.cantidad)), 0);
      
      await API.put(`/compras/${selectedFactura.id}`, {
        proveedor: editHeader.proveedor,
        numero_factura: editHeader.numero_factura,
        total: granTotal,
        productos: editProductos
      });
      
      alert("✅ Factura histórica re-calculada y estantes de inventario actualizados.");
      fetchFacturas();
      closeModal();
    } catch (e) {
      console.error(e);
      alert("❌ Ocurrió un error sincronizando el delta del inventario. Consulta la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
           <h1 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              📥 Historial de Entradas (Compras)
           </h1>
           <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
             Supervisa todos los lotes de mercancía que han ingresado a tu negocio.
           </p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white' }}>
        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Cargando libros contables...</p>
        ) : facturas.length === 0 ? (
          <p className="empty-state">No hay facturas de compra registradas. Completa ingresos en el panel "Facturación Compras".</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>FECHA (INGRESO)</th>
                  <th>ID INT.</th>
                  <th>NO. FACTURA FÍSICA</th>
                  <th>PROVEEDOR</th>
                  <th style={{ textAlign: 'center' }}>PIEZAS TOTALES</th>
                  <th style={{ textAlign: 'right' }}>VALOR AL COSTO</th>
                  <th style={{ textAlign: 'center' }}>Opciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => {
                  const piezas = f.datos_json.reduce((acc, curr) => acc + parseInt(curr.cantidad), 0);
                  return (
                    <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => openModal(f)} className="row-hover">
                      <td style={{ color: '#64748b' }}>{formatearFecha(f.fecha)}</td>
                      <td style={{ fontWeight: 'bold' }}>#{f.id}</td>
                      <td>{f.numero_factura || <span className="text-muted">Desconocido</span>}</td>
                      <td>{f.proveedor || <span className="text-muted">Desconocido</span>}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{piezas} uds.</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: '#0ea5e9' }}>{formatCOP(f.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); openModal(f); }}>
                           Ver Detalle
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL DE DETALLE Y EDICIÓN --- */}
      {selectedFactura && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '1000px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                   <h2 style={{ margin: 0, color: '#0f172a' }}>{isEditing ? '🛠️ Editando Factura de Ingreso' : `📄 Factura Interna #${selectedFactura.id}`}</h2>
                   <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{formatearFecha(selectedFactura.fecha)}</p>
                </div>
                <div>
                   {!isEditing ? (
                     <button className="btn-primary" style={{ backgroundColor: '#eab308', color: '#422006', border: '1px solid #ca8a04' }} onClick={() => setIsEditing(true)}>
                       ✏️ Modificar e Impactar Inventario
                     </button>
                   ) : (
                     <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.9rem' }}>
                       🚨 MODO EDICIÓN ACTIVO: Cuidado con las sumas y restas de inventario.
                     </span>
                   )}
                </div>
             </div>

             {/* CABECERA */}
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>PROVEEDOR / DISTRIBUIDOR</label>
                  {isEditing ? (
                    <input type="text" value={editHeader.proveedor} onChange={e => setEditHeader({...editHeader, proveedor: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  ) : (
                    <p style={{ margin: '0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedFactura.proveedor || "N/A"}</p>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>NO. FACTURA FÍSICA</label>
                  {isEditing ? (
                    <input type="text" value={editHeader.numero_factura} onChange={e => setEditHeader({...editHeader, numero_factura: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  ) : (
                    <p style={{ margin: '0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedFactura.numero_factura || "S/N"}</p>
                  )}
                </div>
             </div>

             {/* TABLA DE PRODUCTOS */}
             <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#334155' }}>📦 Lista de Lote</h3>
               <table className="table" style={{ backgroundColor: 'white' }}>
                 <thead>
                   <tr>
                     <th>CÓDIGO / REF</th>
                     <th>NOMBRE PRODUCTO</th>
                     <th style={{ width: '80px', textAlign: 'center' }}>CANT.</th>
                     <th style={{ textAlign: 'right' }}>COSTO U. (BASE)</th>
                     <th style={{ textAlign: 'right' }}>SUBTOTAL (INVERSIÓN)</th>
                     {isEditing && <th style={{ textAlign: 'center' }}>X</th>}
                   </tr>
                 </thead>
                 <tbody>
                   {editProductos.map((prod, index) => (
                     <tr key={index}>
                       <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{prod.referencia || 'N/A'}</td>
                       <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                       
                       {/* CANTIDAD EDITABLE */}
                       <td style={{ textAlign: 'center' }}>
                         {isEditing ? (
                           <input type="number" min="1" value={prod.cantidad} onChange={e => handleEditItemChange(index, "cantidad", e.target.value)} style={{ width: '60px', padding: '4px', textAlign: 'center' }} />
                         ) : (
                           <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{prod.cantidad}</span>
                         )}
                       </td>

                       {/* PRECIO COMPRA EDITABLE */}
                       <td style={{ textAlign: 'right' }}>
                         {isEditing ? (
                           <input type="number" min="0" value={prod.precio_compra} onChange={e => handleEditItemChange(index, "precio_compra", e.target.value)} style={{ width: '100px', padding: '4px', textAlign: 'right' }} />
                         ) : (
                           formatCOP(prod.precio_compra)
                         )}
                       </td>
                       
                       <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0369a1' }}>
                         {formatCOP(parseFloat(prod.precio_compra) * parseFloat(prod.cantidad))}
                       </td>
                       {isEditing && (
                         <td style={{ textAlign: 'center' }}>
                           <button onClick={() => removeEditItem(index)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px' }}>✖</button>
                         </td>
                       )}
                     </tr>
                   ))}

                    {/* AÑADIR NUEVOS PRODUCTOS AL EDITAR */}
                   {isEditing && (
                     <>
                     {scanMessage.text && (
                       <tr>
                         <td colSpan={6} style={{ padding: '4px 12px', fontSize: '0.85rem', fontWeight: 'bold', color: scanMessage.type === 'error' ? '#dc2626' : '#16a34a', backgroundColor: scanMessage.type === 'error' ? '#fef2f2' : '#f0fdf4' }}>
                           {scanMessage.text}
                         </td>
                       </tr>
                     )}
                     <tr style={{ backgroundColor: '#f0fdf4' }}>
                        <td><input type="text" placeholder="Escanea código y oprime Enter..." value={newProd.referencia} onChange={e=>setNewProd({...newProd, referencia: e.target.value})} onKeyDown={handleRefKeyDown} onBlur={(e) => buscarProductoPorReferencia(e.target.value)} style={{width:'100%', padding:'6px', border: scanMessage.type === 'error' ? '2px solid #ef4444' : '1px solid #22c55e', borderRadius: '4px', fontWeight: 'bold'}} /></td>
                        <td><input type="text" placeholder="Nombre completo..." value={newProd.nombre} onChange={e=>setNewProd({...newProd, nombre: e.target.value})} style={{width:'100%', padding:'4px'}} /></td>
                        <td style={{ textAlign: 'center' }}><input type="number" value={newProd.cantidad} onChange={e=>setNewProd({...newProd, cantidad: parseInt(e.target.value) || 0})} style={{width:'60px', padding:'4px'}} /></td>
                        <td style={{ textAlign: 'right' }}><input type="number" placeholder="Costo Unitario..." value={newProd.precio_compra} onChange={e=>setNewProd({...newProd, precio_compra: e.target.value})} style={{width:'100px', padding:'4px'}} /></td>
                        <td>
                          <button className="btn-primary" onClick={addNewProductToInvoice} style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: '#16a34a' }}>+ Inyectar a Factura</button>
                        </td>
                        <td></td>
                     </tr>
                     <tr style={{ backgroundColor: '#f0fdf4' }}>
                        <td colSpan={6} style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#16a34a' }}>
                           <em>Si el producto no existe, complétalo para crearlo de una vez:</em> 
                           <span style={{ marginLeft: '15px' }}>Categoría: </span><input type="text" value={newProd.categoria} onChange={e=>setNewProd({...newProd, categoria: e.target.value})} style={{width:'120px', padding:'4px', marginRight:'15px', borderRadius: '4px', border: '1px solid #bbf7d0'}} />
                           <span style={{ marginLeft: '10px' }}>Precio Venta Público: </span><input type="number" placeholder="Ej. 15000" value={newProd.precio_venta} onChange={e=>setNewProd({...newProd, precio_venta: e.target.value})} style={{width:'120px', padding:'4px', borderRadius: '4px', border: '1px solid #bbf7d0'}} />
                        </td>
                     </tr>
                     </>
                   )}
                 </tbody>
               </table>
               
               <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
                 Gran Total Invertido: {formatCOP( editProductos.reduce((acc, curr) => acc + (parseFloat(curr.precio_compra) * parseFloat(curr.cantidad)), 0) )}
               </div>
             </div>

             <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={closeModal} disabled={isSaving}>
                  {isEditing ? "❌ Descartar Cambios" : "Cerrar Panel"}
                </button>
                {isEditing && (
                  <button className="btn-primary" onClick={saveEditedInvoice} disabled={isSaving} style={{ backgroundColor: '#0ea5e9' }}>
                    {isSaving ? "🛠️ Impactando Base de Datos..." : "💾 Guardar Edición y Recalcular Almacén"}
                  </button>
                )}
             </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default FacturasCompra;
