import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function InventarioAdmin() {
  const [productos, setProductos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipo, setTipo] = useState<"producto" | "servicio">("producto");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProductos();
  }, [tipo]);

  const fetchProductos = () => {
    setLoading(true);
    API.get(`/productos?tipo=${tipo}`)
      .then(res => setProductos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto permanentemente? Se registrará en el Kardex.")) return;
    
    // Captura de datos para auditoría
    const usuario_nombre = window.prompt("Por favor, ingresa tu NOMBRE para el registro de auditoría:");
    if (!usuario_nombre) return alert("Operación cancelada: El nombre es obligatorio.");

    const motivo = window.prompt("Ingresa el MOTIVO de la eliminación:");
    if (!motivo) return alert("Operación cancelada: El motivo es obligatorio.");

    // Enviar eliminación con cuerpo de datos (Axios delete con cuerpo usa { data: ... })
    API.delete(`/productos/${id}`, { data: { usuario_nombre, motivo } })
      .then(() => {
        alert("✅ Producto eliminado y registrado en el historial de seguridad.");
        fetchProductos();
      })
      .catch(err => alert("Error eliminando producto: " + (err.response?.data?.error || err.message)));
  };

  const handleEdit = (producto: any) => {
    setEditingProduct({ ...producto });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting update for ID:", editingProduct?.id, editingProduct);
    setIsSaving(true);
    API.put(`/productos/${editingProduct.id}`, editingProduct)
      .then(() => {
        alert("✅ Producto actualizado exitosamente");
        setEditingProduct(null);
        fetchProductos();
      })
      .catch(err => alert("Error actualizando producto: " + (err.response?.data?.error || err.message)))
      .finally(() => setIsSaving(false));
  };

  const filtered = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.referencia && p.referencia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Inventario Global
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">Búsqueda, edición y gestión maestra de productos y servicios.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setTipo("producto")}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${tipo === 'producto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          📦 Mercancía (Productos)
        </button>
        <button 
          onClick={() => setTipo("servicio")}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${tipo === 'servicio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          ⚡ Servicios Profesionales
        </button>
      </div>

      <div className="relative group mb-10">
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">🔍</span>
        <input 
          type="text" 
          placeholder={`Buscar ${tipo === 'producto' ? 'productos físicos' : 'servicios'}...`} 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[32px] text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span> 
                {tipo === 'producto' ? 'Inventario de Bodega' : 'Portafolio de Servicios'}
            </h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full">{filtered.length} Registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5">SKU / Ref</th>
                <th className="px-8 py-5">Nombre Ítem</th>
                <th className="px-8 py-5">Categoría</th>
                <th className="px-8 py-5 text-center">Stock</th>
                <th className="px-8 py-5 text-right">Precio Venta</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando inventario...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-300 font-bold italic opacity-50">No hay ítems que coincidan.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      {p.es_servicio ? (
                        <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-lg border border-blue-100 font-medium">SERVICIO</span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 text-[9px] px-2 py-0.5 rounded-lg border border-slate-100 font-medium">PRODUCTO</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-xs font-mono">{(p.referencia || "—")}</td>
                    <td className="px-8 py-6">
                      <div className="text-slate-900 uppercase leading-tight group-hover:text-indigo-600 transition-colors">{p.nombre}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">{p.categoria}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {p.es_servicio ? (
                        <span className="text-slate-300 text-[10px] italic">Ilimitado</span>
                      ) : (
                        <span className={`px-4 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium ${
                          p.cantidad <= 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {p.cantidad} UND
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right text-indigo-600 font-medium">
                      {formatCOP(p.precio_venta)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setEditingProduct(null)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl text-slate-900 flex items-center gap-3">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full"></span> Editar Ítem
               </h2>
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">¿Es un Servicio?</span>
                  <button 
                    type="button"
                    onClick={() => {
                        const nextVal = editingProduct.es_servicio ? 0 : 1;
                        setEditingProduct({
                            ...editingProduct, 
                            es_servicio: nextVal,
                            cantidad: nextVal === 1 ? 0 : editingProduct.cantidad // Reset a 0 si es servicio
                        });
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editingProduct.es_servicio ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingProduct.es_servicio ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                <input 
                  type="text" 
                  value={editingProduct.nombre} 
                  onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Referencia / SKU / Código</label>
                <input 
                  type="text" 
                  value={editingProduct.referencia} 
                  onChange={e => setEditingProduct({...editingProduct, referencia: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                <input 
                  type="text" 
                  value={editingProduct.categoria} 
                  onChange={e => setEditingProduct({...editingProduct, categoria: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>

              {!editingProduct.es_servicio && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Stock Actual (UND)</label>
                  <input 
                    type="number" 
                    value={editingProduct.cantidad} 
                    onChange={e => setEditingProduct({...editingProduct, cantidad: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 bg-amber-50/30 border border-amber-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-amber-50 transition-all font-black text-amber-700"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Costo Unitario ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editingProduct.precio_compra} 
                  onChange={e => {
                    const pc = parseFloat(e.target.value) || 0;
                    const gan = editingProduct.porcentaje_ganancia || 0;
                    setEditingProduct({
                      ...editingProduct, 
                      precio_compra: pc,
                      precio_venta: Math.round(pc + (pc * gan) / 100)
                    });
                  }}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">% Margen Ganancia</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={editingProduct.porcentaje_ganancia} 
                  onChange={e => {
                    const gan = parseFloat(e.target.value) || 0;
                    const pc = editingProduct.precio_compra || 0;
                    setEditingProduct({
                      ...editingProduct, 
                      porcentaje_ganancia: gan,
                      precio_venta: Math.round(pc + (pc * gan) / 100)
                    });
                  }}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">PVP Sugerido ($)</label>
                <input 
                  type="number" 
                  value={editingProduct.precio_venta} 
                  onChange={e => {
                    const pv = parseFloat(e.target.value) || 0;
                    const pc = editingProduct.precio_compra || 0;
                    setEditingProduct({
                      ...editingProduct, 
                      precio_venta: pv,
                      porcentaje_ganancia: pc > 0 ? Math.round(((pv - pc) / pc) * 100) : editingProduct.porcentaje_ganancia
                    });
                  }}
                  className="w-full px-5 py-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl focus:bg-white outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-black text-indigo-700"
                />
              </div>
              
              <div className="col-span-2 space-y-2 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-black">Logística de Venta (Venta en Negativo)</label>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, permitir_venta_negativa: 1 })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingProduct.permitir_venta_negativa ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      Venta Libre
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, permitir_venta_negativa: 0 })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!editingProduct.permitir_venta_negativa ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      Solo Stock
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 italic text-center mt-2">
                  {editingProduct.permitir_venta_negativa ? "Se permite vender incluso sin existencia física (Ideal para servicios)." : "El sistema bloqueará la venta si el stock llega a 0 (Solo productos físicos)."}
                </p>
              </div>

              {editingProduct.es_servicio && (
                <div className="col-span-2 p-5 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in zoom-in duration-300">
                   <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest text-center mb-1">ℹ️ Naturaleza de Servicio Activa</p>
                   <p className="text-[10px] text-blue-500 text-center leading-relaxed">
                      Este ítem no descuenta cantidades al venderse y no requiere stock inicial. Ideal para mano de obra, fletes o consultorías.
                   </p>
                </div>
              )}

              <div className="col-span-2 flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl uppercase tracking-widest text-[10px] font-black hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all uppercase tracking-widest text-[10px] font-black"
                >
                  {isSaving ? "⏳ Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventarioAdmin;

