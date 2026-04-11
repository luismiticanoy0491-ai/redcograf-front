import React, { useState, useEffect } from "react";
import API from "../api/api";

function Proveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre_comercial: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = () => {
    API.get("/proveedores")
      .then(res => setProveedores(res.data))
      .catch(console.error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const apiCall = editingId 
      ? API.put(`/proveedores/${editingId}`, formData)
      : API.post("/proveedores", formData);

    apiCall
      .then(() => {
        alert(editingId ? "✅ Proveedor actualizado" : "✅ Proveedor registrado");
        setFormData({ nombre_comercial: "", nit: "", direccion: "", telefono: "", correo: "" });
        setEditingId(null);
        fetchProveedores();
      })
      .catch(err => {
        console.error(err);
        alert("Error procesando proveedor");
      })
      .finally(() => setIsLoading(false));
  };

  const handleEdit = (p: any) => {
    console.log("✏️ Cargando proveedor para edición:", p);
    setEditingId(p.id);
    setFormData({
      nombre_comercial: p.nombre_comercial || "",
      nit: p.nit || "",
      direccion: p.direccion || "",
      telefono: p.telefono || "",
      correo: p.correo || ""
    });
  };

  const handleCancel = () => {
    setFormData({ nombre_comercial: "", nit: "", direccion: "", telefono: "", correo: "" });
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proveedor?")) return;
    API.delete(`/proveedores/${id}`)
      .then(() => {
        alert("🗑️ Proveedor eliminado");
        fetchProveedores();
      })
      .catch(err => {
        console.error(err);
        alert("Error eliminando proveedor");
      });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Cadena de Suministro
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">Gestión de alianzas comerciales y proveedores logísticos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Form Column */}
        <div className="xl:col-span-4">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-8 space-y-8">
                <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Directorio Logístico</span>
                    <h3 className="text-2xl font-black text-slate-900 leading-none">{editingId ? "Actualizar Aliado" : "Vinculación de Aliado"}</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social <span className="text-rose-500">*</span></label>
                        <input type="text" name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all uppercase" placeholder="Ej: Distribuidora Global S.A" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT / Tax ID</label>
                        <input type="text" name="nit" value={formData.nit} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all uppercase" placeholder="900.000.000-0" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede Operativa</label>
                        <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows={2} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all" placeholder="Carrera 45 # 12-34..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all" placeholder="300 000 0000" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all lowercase" placeholder="proveedor@email.com" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={handleCancel} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all text-center">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-3xl shadow-xl shadow-slate-100 hover:bg-slate-800 hover:-translate-y-1 transition-all uppercase tracking-widest text-[10px]">
                            {isLoading ? "⏳..." : "💾 Guardar Aliado"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* List Column */}
        <div className="xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proveedores.length === 0 ? (
                    <div className="md:col-span-2 py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                        <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">Cero proveedores en el radar.</p>
                    </div>
                ) : (
                    proveedores.map(p => (
                        <div key={p.id} className="group bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all duration-500 flex flex-col justify-between overflow-hidden relative active:scale-95">
                            <div className="relative z-10 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-slate-900 uppercase leading-none truncate group-hover:text-indigo-600 transition-colors">{p.nombre_comercial}</h4>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.nit || "SIN-NIT"}</div>
                                </div>
                                <div className="space-y-2 border-t border-slate-50 pt-4">
                                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600">
                                        <span className="opacity-40">📌</span> <span className="uppercase">{p.direccion || "Domicilio no especificado"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <span className="opacity-40">📞</span> <span>{p.telefono || "Contacto no registrado"}</span>
                                    </div>
                                    {p.correo && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 lowercase italic">
                                            <span className="opacity-40">✉️</span> <span>{p.correo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-700 z-30">
                                <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(p);
                                  }} 
                                  className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-slate-900 hover:scale-110 active:scale-95 transition-all"
                                  title="Editar Proveedor"
                                >
                                    ✏️
                                </button>
                                <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(p.id);
                                  }} 
                                  className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-xl shadow-lg hover:bg-slate-900 hover:scale-110 active:scale-95 transition-all"
                                  title="Eliminar Proveedor"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

export default Proveedores;
