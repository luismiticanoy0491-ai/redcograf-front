import React, { useState, useEffect } from "react";
import API from "../api/api";

function ConfiguracionEmpresa() {
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
    resolucion: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    API.get("/empresa")
      .then(res => {
        if (res.data) {
          setFormData({
            nombre_empresa: res.data.nombre_empresa || "",
            nit: res.data.nit || "",
            direccion: res.data.direccion || "",
            telefono: res.data.telefono || "",
            correo: res.data.correo || "",
            resolucion: res.data.resolucion || ""
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    API.put("/empresa", formData)
      .then(() => {
        setSuccess(true);
        alert("Configuración actualizada.");
      })
      .catch(err => alert("Error guardando."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Identidad Corporativa
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">Configura los datos fiscales y resoluciones oficiales para tus comprobantes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-7">
            <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-10">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-slate-900 rounded-full"></span> Información Legal
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial <span className="text-rose-500">*</span></label>
                            <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all uppercase" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT / RUT / ID <span className="text-rose-500">*</span></label>
                            <input type="text" name="nit" value={formData.nit} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all uppercase" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección de Matriz <span className="text-rose-500">*</span></label>
                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all uppercase" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contacto Telefónico</label>
                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email <span className="text-rose-500">*</span></label>
                            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all lowercase italic" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolución DIAN Autorizada <span className="text-rose-500">*</span></label>
                            <p className="text-[11px] text-slate-400 italic mt-1 ml-1 mb-3">Este texto aparecerá al pie de cada tirilla de venta impresa.</p>
                        </div>
                        <textarea 
                            name="resolucion" 
                            value={formData.resolucion} 
                            onChange={handleChange} 
                            rows={4} 
                            required
                            className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-3xl font-bold text-slate-100 outline-none focus:ring-4 focus:ring-slate-800 transition-all text-xs leading-relaxed" 
                        />
                    </div>

                    <button type="submit" disabled={loading} className={`w-full py-5 rounded-[28px] font-black transition-all uppercase tracking-widest text-xs shadow-2xl ${
                        success ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1'
                    }`}>
                        {loading ? "Sincronizando..." : success ? "✅ Cambios Aplicados" : "💾 Guardar Perfil Corporativo"}
                    </button>
                </form>
            </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-5 sticky top-8">
            <div className="bg-slate-950 p-10 rounded-[48px] border border-slate-800 shadow-2xl overflow-hidden relative group">
                <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-10 text-center opacity-40">Simulación del Comprobante</h3>
                
                <div className="bg-[#fdfdfb] p-8 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm mx-auto text-black font-mono relative">
                    {/* Receipt Texture/Decor */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-48 h-6 bg-[repeating-linear-gradient(45deg,#fdfdfb,#fdfdfb_5px,#eee_5px,#eee_10px)] opacity-50"></div>
                    
                    <div className="text-center space-y-1 py-4 border-b border-dashed border-slate-300">
                        <h4 className="text-sm font-black uppercase leading-tight">{formData.nombre_empresa || "MI EMPRESA S.A.S"}</h4>
                        <p className="text-[10px] font-bold">NIT: {formData.nit || "900.000.000-0"}</p>
                        <p className="text-[9px] uppercase tracking-tighter">{formData.direccion || "Dirección Principal"}</p>
                        <div className="text-[9px] flex justify-center gap-2 opacity-60">
                            {formData.telefono && <span>TEL: {formData.telefono}</span>}
                            {formData.correo && <span>EMAIL: {formData.correo}</span>}
                        </div>
                    </div>

                    <div className="py-6 space-y-4 opacity-30 select-none">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-[9px]">1x ARTÍCULO DEMO</span>
                            <span className="text-[9px]">$10.000</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-[9px]">2x SERVICIO WEB</span>
                            <span className="text-[9px]">$50.000</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-[10px] font-black">TOTAL</span>
                            <span className="text-[10px] font-black">$60.000</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-slate-300 text-center">
                        <p className="text-[9px] leading-relaxed uppercase font-bold italic opacity-60">
                            {formData.resolucion || "=== RESOLUCIÓN DE FACTURACIÓN DIAN VIGENTE ==="}
                        </p>
                        <div className="mt-8 text-[10px] font-bold tracking-widest opacity-40 uppercase">¡GRACIAS POR SU COMPRA!</div>
                        <div className="mt-2 text-[8px] opacity-20">Facturado por RedCograf v2.0</div>
                    </div>

                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-48 h-6 bg-[repeating-linear-gradient(45deg,#fdfdfb,#fdfdfb_5px,#eee_5px,#eee_10px)] opacity-50"></div>
                </div>

                <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] text-white/50 leading-relaxed font-medium italic">
                        "La información suministrada en este panel impacta legalmente el historial de ventas y la validez de los comprobantes emitidos ante entes reguladores."
                    </p>
                </div>

                {/* Decorative blob */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default ConfiguracionEmpresa;
