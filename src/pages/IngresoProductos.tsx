import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import { Proveedor, Borrador, ProductoIngresado } from "../types";

interface FormDataState {
  referencia: string;
  nombre: string;
  categoria: string;
  nuevaCategoria: string;
  cantidad: string | number;
  precio_compra: string | number;
  porcentaje_ganancia: string | number;
  precio_venta: string | number;
}

function IngresoProductos() {
  const [formData, setFormData] = useState<FormDataState>({
    referencia: "",
    nombre: "",
    categoria: "",
    nuevaCategoria: "",
    cantidad: 1,
    precio_compra: "",
    porcentaje_ganancia: 40,
    precio_venta: "",
  });

  const [proveedor, setProveedor] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [productosIngresados, setProductosIngresados] = useState<ProductoIngresado[]>([]);
  const [proveedoresDB, setProveedoresDB] = useState<Proveedor[]>([]);
  const [productosDB, setProductosDB] = useState<any[]>([]);

  // Draft System State
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [draftsList, setDraftsList] = useState<Borrador[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // States
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState("");

  // Load drafts from API
  const fetchDrafts = async () => {
    try {
      const res = await API.get("/borradores");
      setDraftsList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDrafts();
    API.get("/proveedores").then(res => setProveedoresDB(res.data)).catch(console.error);
    API.get("/productos").then(res => setProductosDB(res.data)).catch(console.error);
  }, []);

  const buscarProductoPorReferencia = async (codigo: string) => {
    if (!codigo) return;
    try {
      const res = await API.get(`/productos/buscar/${encodeURIComponent(codigo)}`);
      setFormData(prev => ({
        ...prev,
        nombre: res.data.nombre || "",
        categoria: res.data.categoria || "",
        precio_compra: res.data.precio_compra || "",
        porcentaje_ganancia: res.data.porcentaje_ganancia || 40,
        precio_venta: res.data.precio_venta || "",
      }));
      setMensajeEstado("✅ PRODUCTO EXISTENTE CARGADO");
      setTimeout(() => setMensajeEstado(""), 4000);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMensajeEstado("⚠️ CREAR NUEVO PRODUCTO");
        setFormData(prev => ({
          ...prev,
          nombre: "",
          categoria: "",
          nuevaCategoria: "",
          precio_compra: "",
          precio_venta: ""
        }));
      }
    }
  };

  const handleKeyDownReferencia = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarProductoPorReferencia(formData.referencia.trim());
    }
  };

  const handleBlurReferencia = () => {
    if (formData.referencia.trim() !== '') {
      buscarProductoPorReferencia(formData.referencia.trim());
    } else {
      setMensajeEstado("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      let newState = { ...prev, [name]: value };
      
      // Auto-recalcular venta cuando cambia costo o ganancia
      if (name === 'precio_compra' || name === 'porcentaje_ganancia') {
        const pcStr = name === 'precio_compra' ? value : prev.precio_compra;
        const ganStr = name === 'porcentaje_ganancia' ? value : prev.porcentaje_ganancia;
        const pc = parseFloat(pcStr.toString()) || 0;
        const ganancia = parseFloat(ganStr.toString()) || 0;
        newState.precio_venta = Math.round(pc + (pc * ganancia) / 100).toString();
      }
      
      // Si el humano escribe manualmente el precio de venta, recalcular porcentaje (pero sin decimales en PV)
      if (name === 'precio_venta') {
        const pc = parseFloat(prev.precio_compra.toString()) || 0;
        const pv = parseFloat(value) || 0;
        if (pc > 0) {
          newState.porcentaje_ganancia = Math.round(((pv - pc) / pc) * 100);
        }
      }

      return newState;
    });
  };

  const handleAddToList = (e: React.FormEvent) => {
    e.preventDefault();
    let categoriaFinal = formData.categoria;
    if (categoriaFinal === "Otra") {
      if (!formData.nuevaCategoria.trim()) return alert("Ingresa el nombre de la nueva categoría.");
      categoriaFinal = formData.nuevaCategoria.trim();
    }
    if (!formData.nombre || !categoriaFinal || formData.precio_compra === "") {
      return alert("Datos incompletos.");
    }
    const nuevoProducto = {
      ...formData,
      categoria: categoriaFinal,
      cantidad: parseInt(formData.cantidad.toString(), 10),
      precio_compra: parseFloat(formData.precio_compra.toString()) || 0,
      porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia.toString()) || 0,
      precio_venta: Math.round(parseFloat(formData.precio_venta.toString()) || 0), // Eliminamos decimales
      inyectado: false // Flag para inyección viva al inventario
    };

    setProductosIngresados([nuevoProducto, ...productosIngresados]);
    setFormData({ ...formData, referencia: "", nombre: "", nuevaCategoria: "", cantidad: 1, precio_compra: "", precio_venta: "" });
  };

  const handleSaveDraft = async () => {
    if (productosIngresados.length === 0) return alert("Añade al menos un producto a la lista temporal.");
    setIsSavingDraft(true);
    try {
      if (currentDraftId) await API.delete(`/borradores/${currentDraftId}`); // Erase old to avoid dupes on manual update
      const res = await API.post("/borradores", {
        proveedor: proveedor,
        numero_factura: numeroFactura,
        datos_json: productosIngresados
      });
      alert("📝 Borrador de factura guardado. Los productos agregados ya están disponibles para la venta en el sistema.");
      let savedData = res.data.datos_json || res.data.detalles;
      if (typeof savedData === 'string') {
        try { savedData = JSON.parse(savedData); } catch (e) {}
      }
      setProductosIngresados(Array.isArray(savedData) ? savedData : productosIngresados);
      setCurrentDraftId(res.data.id);
      fetchDrafts();
    } catch (e) {
      alert("Error guardando el borrador.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveBatch = async () => {
    if (productosIngresados.length === 0) return;
    setIsSavingBatch(true);
    try {
      // Calculate total to save with invoice
      const granTotal = productosIngresados.reduce((acc, curr) => acc + (parseFloat(curr.precio_compra.toString()) * curr.cantidad), 0);

      await API.post("/compras", {
        proveedor,
        numero_factura: numeroFactura,
        total: granTotal,
        productos: productosIngresados
      });
      alert("✅ Factura completada y enviada a la Base de Datos central.");

      // Clean up draft if this stemmed from one
      if (currentDraftId) {
        await API.delete(`/borradores/${currentDraftId}`);
      }
      resetWorkspace();
      fetchDrafts();
    } catch (error) {
      console.error(error);
      alert("❌ Hubo un error al guardar al inventario.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const loadDraft = (d: Borrador) => {
    setProveedor(d.proveedor || "");
    setNumeroFactura(d.numero_factura || "");
    
    let parsedProductos = [];
    try {
      const rawDatos = d.detalles || (d as any).datos_json;
      if (typeof rawDatos === 'string') {
        parsedProductos = JSON.parse(rawDatos);
      } else if (rawDatos) {
        parsedProductos = rawDatos;
      }
    } catch (e) {
      console.error("Error parsing borrador detalles:", e);
    }
    
    setProductosIngresados(Array.isArray(parsedProductos) ? parsedProductos : []);
    setCurrentDraftId(d.id);
    setShowDrafts(false);
  };

  const resetWorkspace = () => {
    setProductosIngresados([]);
    setProveedor("");
    setNumeroFactura("");
    setCurrentDraftId(null);
  };

  const removeItem = async (index: number) => {
    const item = productosIngresados[index];
    if (item.inyectado) {
       const confirm = window.confirm("⚠️ Este producto ya fue sumado al inventario general para su venta. ¿Deseas descontar su cantidad de la base de datos para no afectar tu stock real?");
       if (confirm) {
           try {
               await API.post("/productos/revertir-stock", { referencia: item.referencia, nombre: item.nombre, cantidad: item.cantidad });
               alert("✅ Stock descontado de la base de datos.");
           } catch(e) {
               console.error(e);
               return alert("❌ Error al descontar stock. Por seguridad no se removió el artículo del borrador.");
           }
       } else {
           // Si el usuario cancela, no borramos el ítem para evitar inconsistencias de inventario
           return;
       }
    }
    const list = [...productosIngresados];
    list.splice(index, 1);
    setProductosIngresados(list);
  };

  const valorTotalIngresados = productosIngresados.reduce((total, p) => total + (parseFloat(p.precio_compra.toString()) * parseFloat(p.cantidad.toString())), 0);
  const valorVentaTotal = productosIngresados.reduce((total, p) => total + (parseFloat(p.precio_venta.toString()) * parseFloat(p.cantidad.toString())), 0);

  const handleDownloadBackup = () => {
    // Usar la base URL dinámica según esté configurado en `api.js` local o red
    const baseURL = API.defaults.baseURL || "http://localhost:4000";
    window.location.href = `${baseURL}/backup/download`;
  };

  return (
    <div className="pos-layout fade-in" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* LADO IZQUIERDO: FORMULARIO SCROLLABLE */}
      <div className="pos-catalog no-print" style={{ paddingBottom: '4rem', overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2>Facturación de Ingresos</h2>
          <p>Administra lotes de ingreso, facturas pendientes e inyéctalas al inventario.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleDownloadBackup} className="btn-primary" style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#10b981', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} title="Genera un archivo con toda tu información en un click">
            💾 Descargar Copia de Seguridad
          </button>
          <button onClick={() => setShowDrafts(!showDrafts)} className="btn-secondary" style={{ padding: '0.75rem 1rem', border: '1px solid var(--primary)', borderRadius: '8px', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
            📂 Ver {draftsList.length} Facturas Pendientes
          </button>
        </div>
      </div>

      {showDrafts && (
        <div className="card fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <h3>Borradores Pendientes</h3>
          {draftsList.length === 0 ? <p className="text-muted">No hay borradores guardados.</p> : (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              {draftsList.map(d => (
                <div key={d.id} style={{ minWidth: '250px', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(d.fecha).toLocaleString()}</div>
                  <div style={{ fontWeight: 'bold', margin: '0.5rem 0' }}>{d.proveedor || "Proveedor sin nombre"}</div>
                  {d.numero_factura && <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Factura: {d.numero_factura}</div>}
                  <button onClick={() => loadDraft(d)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Cargar este progreso</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORMULARIO PRINCIPAL */}
      <div className="card form-card" style={{ marginBottom: '2rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            {currentDraftId ? "🟢 Editando Factura Pendiente" : "1. Datos de Factura/Producto"}
          </h3>

          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Empresa / Proveedor</label>
              <input 
                list="lista-proveedores"
                type="text" 
                value={proveedor} 
                onChange={e => setProveedor(e.target.value)} 
                placeholder="Ej. TechCorp Ltda. (Busca o escribe)" 
                style={{ borderColor: 'var(--primary)', borderWidth: '2px' }} 
              />
              <datalist id="lista-proveedores">
                {proveedoresDB.map(p => (
                  <option key={p.id} value={p.nombre_comercial}>{p.nit ? `NIT: ${p.nit}` : ''}</option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Número de Factura</label>
              <input type="text" value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} placeholder="Ej. FAC-00123" style={{ borderColor: 'var(--primary)', borderWidth: '2px' }} />
            </div>
          </div>

          <form onSubmit={handleAddToList} className="ingreso-form" style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#334155' }}>Línea de Producto</h4>
            
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              <div className="form-group" style={{ marginBottom: '1rem', flex: 1 }}>
                <label>Código de Barras / Referencia</label>
                <input 
                  list="lista-referencias"
                  type="text" 
                  name="referencia" 
                  value={formData.referencia} 
                  onChange={handleChange} 
                  onKeyDown={handleKeyDownReferencia}
                  onBlur={handleBlurReferencia}
                  placeholder="Escanea o escribe + Enter" 
                  autoFocus
                  style={{ borderColor: mensajeEstado.includes("CREAR") ? '#f59e0b' : mensajeEstado.includes("EXISTENTE") ? '#10b981' : 'var(--primary)' }}
                />
                <datalist id="lista-referencias">
                  {productosDB.map((p, idx) => (
                    <option key={idx} value={p.referencia || p.nombre}>{p.nombre}</option>
                  ))}
                </datalist>
                {mensajeEstado && (
                  <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 'bold', color: mensajeEstado.includes("CREAR") ? '#d97706' : '#059669' }}>
                    {mensajeEstado}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem', flex: 1 }}>
                <label>Nombre del Producto</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Tarjeta Gráfica" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select name="categoria" value={formData.categoria} onChange={handleChange} required>
                  <option value="">-- Seleccionar --</option>
                  <option value="PAPELERIA">PAPELERIA</option>
                  <option value="JOYERIA">JOYERIA</option>
                  <option value="MECATO">MECATO</option>
                  <option value="DETALLES">DETALLES</option>
                  <option value="PERFUMERIA">PERFUMERIA</option>
                  <option value="TECNOLOGIA">TECNOLOGIA</option>
                  <option value="IMPRESIONES-MAQUINAS">IMPRESIONES-MAQUINAS</option>
                  <option value="Otra">➕ Crear nueva...</option>
                </select>

                {formData.categoria === "Otra" && (
                  <input type="text" name="nuevaCategoria" value={formData.nuevaCategoria} onChange={handleChange} placeholder="Nombre de categoría" style={{ marginTop: '0.5rem' }} required />
                )}
              </div>
              <div className="form-group">
                <label>Cantidad (Stock)</label>
                <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} min="1" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Costo de Compra (c/u)</label>
                <input type="number" step="0.01" name="precio_compra" value={formData.precio_compra} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>% Ganancia</label>
                <input type="number" step="0.1" name="porcentaje_ganancia" value={formData.porcentaje_ganancia} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #7dd3fc', marginBottom: '0.5rem' }}>
              <label style={{ color: '#0369a1', fontWeight: 'bold' }}>Venta al Público ($ COP)</label>
              <input 
                type="number" 
                name="precio_venta" 
                value={formData.precio_venta} 
                onChange={handleChange} 
                style={{ fontSize: '1.2rem', padding: '0.6rem', fontWeight: 'bold', borderColor: '#0ea5e9', borderStyle: 'dashed' }}
                required 
              />
            </div>

            <button type="submit" className="full-width" style={{ backgroundColor: "white", color: "var(--primary)", border: "2px dashed var(--primary)", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "0.5rem" }}>
              ⬇ Agregar artículo al lote
            </button>
          </form>
        </div>
      </div>

      {/* LADO DERECHO: VISTA DE LOTE FIJO */}
      <div className="pos-cart-panel" style={{ backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', boxShadow: '-4px 0 15px rgba(0,0,0,0.02)' }}>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>📦 Lote de Ingreso ({productosIngresados.length})</h3>
        
        <div className="cart-items-container" style={{ flex: '1', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>X</th>
                </tr>
              </thead>
              <tbody>
                {productosIngresados.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No has escaneado/ingresado productos.</td></tr>
                ) : (
                  productosIngresados.map((p: ProductoIngresado, index: number) => (
                    <tr key={index}>
                      <td>
                        <span className="product-name">{p.nombre}</span>
                        {p.referencia && <span style={{ fontSize: '0.75rem', color: '#888' }}>{p.referencia}</span>}<br />
                        <span className="badge category-badge">{p.categoria}</span>
                      </td>
                      <td>{p.cantidad} {p.inyectado && <span title="Ya sumado en el inventario real para la venta" style={{ cursor: 'help', fontSize: '0.8rem' }}>✅</span>}</td>
                      <td>{formatCOP(p.precio_compra)}</td>
                      <td>{formatCOP(p.precio_venta)}</td>
                      <td>
                        <button onClick={() => removeItem(index)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* FOOTER ADHERIDO A LA RAMA DERECHA */}
        <div className="cart-summary" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}>
          <div className="totals-footer" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="stat-box" style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Costo Total Lote:</span>
              <h3 style={{ margin: '0.5rem 0 0 0', color: '#0f172a' }}>{formatCOP(valorTotalIngresados)}</h3>
            </div>
            <div className="stat-box highlight" style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#166534' }}>Venta Proyectada:</span>
              <h3 style={{ margin: '0.5rem 0 0 0', color: '#15803d' }}>{formatCOP(valorVentaTotal)}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSaveDraft} disabled={isSavingDraft} style={{ flex: 1, padding: '1rem', fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold', border: 'none' }}>
              {isSavingDraft ? "Guardando..." : "📄 Guardar Borrador"}
            </button>
            <button onClick={handleSaveBatch} disabled={isSavingBatch || productosIngresados.length === 0} style={{ flex: 1.5, padding: '1rem', fontSize: '1rem', backgroundColor: productosIngresados.length === 0 ? '#94a3b8' : 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: productosIngresados.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: productosIngresados.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none' }}>
              {isSavingBatch ? "Procesando..." : `✅ Finalizar Ingreso`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IngresoProductos;
