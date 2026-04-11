import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function Cajeros() {
  const [cajeros, setCajeros] = useState<any[]>([]);
  
  // States for form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    direccion: "",
    fecha_contrato: "",
    salario: "",
    paga_comisiones: false,
    porcentaje_comision: ""
  });

  const fetchCajeros = () => {
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchCajeros();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: "", documento: "", telefono: "", direccion: "",
      fecha_contrato: "", salario: "", paga_comisiones: false, porcentaje_comision: ""
    });
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      nombre: c.nombre || "",
      documento: c.documento || "",
      telefono: c.telefono || "",
      direccion: c.direccion || "",
      fecha_contrato: c.fecha_contrato ? c.fecha_contrato.split('T')[0] : "",
      salario: c.salario || "",
      paga_comisiones: c.paga_comisiones === 1 || c.paga_comisiones === true,
      porcentaje_comision: c.porcentaje_comision || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return alert("Nombre obligatorio");
    
    try {
      if (editingId) {
        await API.put(`/cajeros/${editingId}`, formData);
      } else {
        await API.post("/cajeros", formData);
      }
      resetForm();
      fetchCajeros();
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ ¿Dar de baja a este empleado?")) return;
    try {
      await API.delete(`/cajeros/${id}`);
      fetchCajeros();
    } catch (error) {
      alert("Error eliminando empleado");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-medium tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Gestión de Talento
          </h1>
          <p className="text-slate-500 font-normal text-lg italic">Control de nómina, comisiones y perfiles autorizados para caja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Form Column */}
        <div className="xl:col-span-4">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-8">
                <h3 className="text-xl font-medium text-slate-900 mb-8 flex items-center gap-2">
                    <span className="w-2 h-6 bg-sky-600 rounded-full"></span> 
                    {editingId ? "Editar Colaborador" : "Nuevo Colaborador"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-normal outline-none focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all border-sky-100" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Documento / CC</label>
                            <input type="text" name="documento" value={formData.documento} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-normal outline-none focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">F. Ingreso</label>
                            <input type="date" name="fecha_contrato" value={formData.fecha_contrato} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-normal outline-none focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-normal outline-none focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Salario Base</label>
                            <input type="number" name="salario" value={formData.salario} onChange={handleChange} className="w-full px-5 py-3 bg-sky-50 border border-sky-100 rounded-2xl font-medium text-sky-700 outline-none focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all" />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative">
                                <input type="checkbox" name="paga_comisiones" checked={formData.paga_comisiones} onChange={handleChange} className="sr-only peer" />
                                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                             </div>
                             <span className="text-xs font-medium text-slate-700 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">Ventas por Comisión</span>
                        </label>
                        
                        {formData.paga_comisiones && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest ml-1 block mb-2">% de Ganancia</label>
                                <div className="relative">
                                    <input type="number" step="0.1" name="porcentaje_comision" value={formData.porcentaje_comision} onChange={handleChange} className="w-full px-5 py-3 bg-white border border-emerald-200 rounded-2xl font-medium text-emerald-700 outline-none" placeholder="0.0" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-emerald-300">%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl font-medium text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                        )}
                        <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-3xl font-medium shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs">
                            {editingId ? "💾 Actualizar Perfil" : "👤 Dar de Alta"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* List Column */}
        <div className="xl:col-span-8">
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-6 bg-slate-900 rounded-full"></span> Planta de Personal
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full">{cajeros.length} Empleados</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100">Colaborador</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Vinculación</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Compensación</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Esquema</th>
                                <th className="px-8 py-5 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cajeros.map(c => (
                                <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-medium text-slate-900 uppercase leading-tight group-hover:text-sky-600 transition-colors">{c.nombre}</div>
                                        <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">ID: {c.documento || "—"}</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-xs font-normal text-slate-600 italic">
                                            {c.fecha_contrato ? new Date(c.fecha_contrato).toLocaleDateString() : 'Indefinido'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="font-medium text-slate-900">{formatCOP(c.salario)}</div>
                                        <div className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Base Mensual</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {c.paga_comisiones ? (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-medium uppercase tracking-tighter">Comisión {c.porcentaje_comision}%</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[9px] font-medium uppercase tracking-tighter">Fijo</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleEdit(c)} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-sky-600 hover:border-sky-100 hover:shadow-lg transition-all font-bold">✏️</button>
                                            <button onClick={() => handleDelete(c.id)} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all font-bold">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default Cajeros;
