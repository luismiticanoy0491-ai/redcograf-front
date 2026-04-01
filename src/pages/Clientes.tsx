import React, { useState, useEffect } from "react";
import API from "../api/api";

function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ 
    nombre: "", 
    documento: "", 
    telefono: "", 
    correo: "", 
    direccion: "" 
  });

  const fetchClientes = () => {
    API.get("/clientes").then(res => setClientes(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return alert("El nombre es obligatorio");
    try {
      const dataToSubmit = { 
        ...formData, 
        correo: formData.correo.trim() === "" ? "nna" : formData.correo 
      };
      await API.post("/clientes", dataToSubmit);
      setFormData({ nombre: "", documento: "", telefono: "", correo: "", direccion: "" });
      fetchClientes();
    } catch (error) {
      alert("Error registrando cliente");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar cliente del sistema?")) return;
    try {
      await API.delete(`/clientes/${id}`);
      fetchClientes();
    } catch (error) {
      alert("Error eliminando cliente");
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.documento && c.documento.includes(searchTerm))
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Fidelización (CRM)
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">Base de datos central de clientes, distribuidores y contactos.</p>
        </div>
        <div className="w-full md:w-auto relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">🔍</span>
            <input 
                type="text" 
                placeholder="Buscar por nombre o ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-400 transition-all font-bold text-slate-700"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Form Card */}
        <div className="xl:col-span-1">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-8">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                    <span className="w-2 h-6 bg-violet-600 rounded-full"></span> Nuevo Registro
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo / Razón Social</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula / NIT</label>
                        <input type="text" name="documento" value={formData.documento} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono (WhatsApp)</label>
                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Opcional)</label>
                        <input type="text" name="correo" value={formData.correo} onChange={handleChange} placeholder="nna@redcograf.com" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all" />
                    </div>
                    <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-3xl font-black shadow-xl shadow-violet-100 hover:bg-violet-700 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs">
                        ⭐ Vincular Cliente
                    </button>
                </form>
            </div>
        </div>

        {/* List Card */}
        <div className="xl:col-span-2">
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-6 bg-slate-900 rounded-full"></span> Cartera de Contactos
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                        {filteredClientes.length} Registros Activos
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Información del Cliente</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contacto</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ubicación</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">X</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredClientes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic opacity-40">No hay clientes en la mira.</td>
                                </tr>
                            ) : (
                                filteredClientes.map(c => (
                                    <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-900 uppercase leading-tight group-hover:text-violet-600 transition-colors">{c.nombre}</div>
                                            <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter italic">ID: {c.documento || "SIN IDENTIFICAR"}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">📱 {c.telefono || "—"}</span>
                                                <span className="text-[10px] font-medium text-slate-400 lowercase">{c.correo === 'nna' ? 'sin correo' : c.correo}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{c.direccion || "🌎 Venta Local"}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {c.id !== 1 && (
                                                <button 
                                                    onClick={() => handleDelete(c.id)} 
                                                    className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all font-bold"
                                                >
                                                    🗑
                                                </button>
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
  );
}

export default Clientes;
