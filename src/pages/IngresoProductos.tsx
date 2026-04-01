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
    } catch (error: any) {
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
      
      if (name === 'precio_compra' || name === 'porcentaje_ganancia') {
        const pcStr = name === 'precio_compra' ? value : prev.precio_compra;
        const ganStr = name === 'porcentaje_ganancia' ? value : prev.porcentaje_ganancia;
        const pc = parseFloat(pcStr.toString()) || 0;
        const ganancia = parseFloat(ganStr.toString()) || 0;
        newState.precio_venta = Math.round(pc + (pc * ganancia) / 100).toString();
      }
      
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
      precio_venta: Math.round(parseFloat(formData.precio_venta.toString()) || 0),
      inyectado: false
    };

    setProductosIngresados([nuevoProducto, ...productosIngresados]);
    setFormData({ ...formData, referencia: "", nombre: "", nuevaCategoria: "", cantidad: 1, precio_compra: "", precio_venta: "" });
  };

  const handleSaveDraft = async () => {
    if (productosIngresados.length === 0) return alert("Añade al menos un producto a la lista temporal.");
    setIsSavingDraft(true);
    try {
      if (currentDraftId) await API.delete(`/borradores/${currentDraftId}`);
      const res = await API.post("/borradores", {
        proveedor: proveedor,
        numero_factura: numeroFactura,
        datos_json: productosIngresados
      });
      alert("📝 Borrador guardado exitosamente.");
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
      const granTotal = productosIngresados.reduce((acc, curr) => acc + (parseFloat(curr.precio_compra.toString()) * curr.cantidad), 0);

      await API.post("/compras", {
        proveedor,
        numero_factura: numeroFactura,
        total: granTotal,
        productos: productosIngresados
      });
      alert("✅ Factura completada y enviada a la Base de Datos central.");

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
       const confirm = window.confirm("⚠️ Este producto ya fue sumado al inventario general. ¿Deseas descontar su cantidad de la base de datos?");
       if (confirm) {
           try {
               await API.post("/productos/revertir-stock", { referencia: item.referencia, nombre: item.nombre, cantidad: item.cantidad });
               alert("✅ Stock descontado de la base de datos.");
           } catch(e) {
               console.error(e);
               return alert("❌ Error al descontar stock.");
           }
       } else {
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
    const baseURL = API.defaults.baseURL || "http://localhost:4000";
    window.location.href = `${baseURL}/backup/download`;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500 overflow-hidden pb-10">
      
      {/* LEFT: Management & Form */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-none">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    Suministro de Inventario
                </h1>
                <p className="text-slate-500 font-medium text-lg italic">Registra entradas masivas de mercancía y controla tus costos.</p>
            </div>
            <div className="flex gap-3 no-print">
                <button onClick={handleDownloadBackup} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs rounded-2xl shadow-sm hover:shadow-xl hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center gap-2">
                   💾 Backup Global
                </button>
                <button onClick={() => setShowDrafts(!showDrafts)} className="px-6 py-3 bg-indigo-600 text-white font-black text-xs rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest">
                   📂 Pendientes ({draftsList.length})
                </button>
            </div>
        </div>

        {showDrafts && (
          <div className="bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100 animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-black text-indigo-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Lotes Guardados Temporalmente
            </h3>
            {draftsList.length === 0 ? <p className="text-indigo-400 font-bold italic">No hay borradores guardados.</p> : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {draftsList.map(d => (
                  <button key={d.id} onClick={() => loadDraft(d)} className="min-w-[280px] bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm text-left hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{new Date(d.fecha).toLocaleString()}</div>
                    <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{d.proveedor || "Sin Proveedor"}</div>
                    {d.numero_factura && <div className="text-xs font-bold text-slate-500 mt-1">Ref: {d.numero_factura}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Empresa Proveedora</label>
                    <input 
                        list="lista-proveedores"
                        type="text" 
                        value={proveedor} 
                        onChange={e => setProveedor(e.target.value)} 
                        placeholder="Ej. Distribuidora Central..." 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase"
                    />
                    <datalist id="lista-proveedores">
                        {proveedoresDB.map(p => (
                        <option key={p.id} value={p.nombre_comercial}>{p.nit ? `NIT: ${p.nit}` : ''}</option>
                        ))}
                    </datalist>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"># de Factura Física</label>
                    <input type="text" value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} placeholder="Ej. FV-10022" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase" />
                </div>
            </div>

            <form onSubmit={handleAddToList} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 space-y-8">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Agregar Item a Factura</h4>
                    {mensajeEstado && <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${mensajeEstado.includes("EXISTENTE") ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{mensajeEstado}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Código SKU / Barras</label>
                        <input 
                            list="lista-referencias"
                            type="text" 
                            name="referencia" 
                            value={formData.referencia} 
                            onChange={handleChange} 
                            onKeyDown={handleKeyDownReferencia}
                            onBlur={handleBlurReferencia}
                            placeholder="Escanea o escribe + Enter..." 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                        <datalist id="lista-referencias">
                        {productosDB.map((p, idx) => (
                            <option key={idx} value={p.referencia || p.nombre}>{p.nombre}</option>
                        ))}
                        </datalist>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Nombre del Artículo</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Perfume X 100ml" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Categoría</label>
                        <select name="categoria" value={formData.categoria} onChange={handleChange} required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none appearance-none">
                            <option value="">-- Escoger --</option>
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
                        <input type="text" name="nuevaCategoria" value={formData.nuevaCategoria} onChange={handleChange} placeholder="Nombre categoría" className="w-full px-5 py-3 mt-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" required />
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Cantidad (Unds)</label>
                        <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} min="1" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 text-center" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Costo Unitario ($)</label>
                        <input type="number" step="0.01" name="precio_compra" value={formData.precio_compra} onChange={handleChange} required className="w-full px-5 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-black text-white text-center" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200/50">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Margen de Ganancia (%)</label>
                        <input type="number" step="0.1" name="porcentaje_ganancia" value={formData.porcentaje_ganancia} onChange={handleChange} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-emerald-600 text-center" />
                    </div>

                    <div className="space-y-1 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                        <label className="text-[10px] font-black text-emerald-600 tracking-widest ml-1 uppercase mb-2">Precio de Venta Sugerido</label>
                        <input 
                            type="number" 
                            name="precio_venta" 
                            value={formData.precio_venta} 
                            onChange={handleChange} 
                            className="w-full bg-transparent text-2xl font-black text-emerald-700 outline-none placeholder:text-emerald-200"
                            required 
                        />
                    </div>
                </div>

                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-widest">
                    ⬇ Cargar al Lote Temporal
                </button>
            </form>
        </div>
      </div>

      {/* RIGHT: Fixed Batch View */}
      <div className="w-full lg:w-[480px] bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white group">
        <div className="p-10 border-b border-slate-800">
            <h3 className="text-xl font-black tracking-tight flex items-center justify-between">
                <span>📦 Lote en Preparación</span>
                <span className="bg-sky-500/10 text-sky-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-500/20">{productosIngresados.length} Items</span>
            </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-none">
            {productosIngresados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 text-center">
                  <div className="text-6xl mb-6">📥</div>
                  <p className="font-black uppercase tracking-widest text-[10px]">Esperando ingreso de mercancía</p>
                </div>
            ) : (
                productosIngresados.map((p, index) => (
                    <div key={index} className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50 hover:border-slate-600 transition-all relative group/item">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-slate-100 truncate uppercase tracking-tight leading-tight">{p.nombre}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">{p.categoria}</span>
                                    {p.referencia && <span className="text-[9px] font-bold text-slate-500">REF: {p.referencia}</span>}
                                </div>
                            </div>
                            <button onClick={() => removeItem(index)} className="text-slate-600 hover:text-red-500 transition-colors font-black text-xl">&times;</button>
                        </div>
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/30">
                            <div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Volúmen</span>
                                <span className="text-sm font-black text-slate-100">{p.cantidad} <span className="text-[9px] opacity-40 font-bold uppercase">UND</span></span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Venta</span>
                                <span className="text-sm font-black text-emerald-400">{formatCOP(p.precio_venta)}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-10 bg-slate-950/50 backdrop-blur-xl border-t border-slate-800 space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Inversión Costo</span>
                    <h3 className="text-xl font-black text-slate-100">{formatCOP(valorTotalIngresados)}</h3>
                </div>
                <div className="space-y-1 text-right">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Venta Estimada</span>
                    <h3 className="text-xl font-black text-emerald-400">{formatCOP(valorVentaTotal)}</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleSaveDraft} disabled={isSavingDraft} className="py-5 bg-slate-800 text-slate-400 font-black rounded-[28px] hover:text-white transition-all border border-slate-700 uppercase tracking-widest text-[10px]">
                    {isSavingDraft ? "Guardando..." : "📄 Borrador"}
                </button>
                <button onClick={handleSaveBatch} disabled={isSavingBatch || productosIngresados.length === 0} className="py-5 bg-emerald-600 text-white font-black rounded-[28px] shadow-2xl shadow-emerald-500/10 hover:bg-emerald-500 hover:-translate-y-1 transition-all disabled:opacity-20 disabled:grayscale uppercase tracking-widest text-[10px]">
                    {isSavingBatch ? "Procesando..." : `✅ Finalizar Ingreso`}
                </button>
            </div>
            
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
        </div>
      </div>
    </div>
  );
}

export default IngresoProductos;
