import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

const RegistroSaaS = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    niti: '',
    telefono: '',
    correo: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/auth/registro-empresa', formData);
      alert(data.message);
      
      const loginRes = await API.post('/auth/login', {
        username: formData.username,
        password: formData.password
      });

      if (loginRes.data.success) {
        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('adminToken', loginRes.data.token); 
        localStorage.setItem('userName', loginRes.data.username);
        localStorage.setItem('userRole', loginRes.data.role);
        localStorage.setItem('empresa_id', loginRes.data.empresa_id);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 overflow-y-auto p-4 py-10">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500 my-auto">
        <div className="bg-white rounded-[48px] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
            
            {/* Sidebar Visual */}
            <div className="lg:col-span-2 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden hidden lg:flex">
                <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shadow-soft">🚀</div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tighter leading-tight">Comienza tu <span className="text-sky-400">Prueba Gratis</span></h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed italic">7 días de acceso total sin tarjeta.</p>
                    </div>
                </div>

                <div className="relative z-10 space-y-4 pt-12">
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Sistema Multitenant
                   </div>
                   <p className="text-slate-500 text-[9px] leading-relaxed uppercase font-black opacity-40">Accede a auditorías, inventarios y terminal POS desde cualquier lugar.</p>
                </div>

                {/* Decorative BG */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-3 p-8 md:p-10 space-y-8">
                <div className="space-y-1 block lg:hidden text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Negocio</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">7 Días Gratis de Nube POS</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidad Corporativa</label>
                            <input type="text" name="nombre_comercial" placeholder="Nombre Comercial del Negocio *" required onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all uppercase" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT / ID (Opc.)</label>
                                <input type="text" name="niti" placeholder="900.000..." onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all uppercase" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contacto</label>
                                <input type="text" name="telefono" placeholder="WhatsApp / Tel" onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Facturación</label>
                            <input type="email" name="correo" placeholder="admin@negocio.com *" required onChange={handleChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all lowercase" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1 italic">Usuario Admin</label>
                                <input type="text" name="username" placeholder="Tu Usuario" required onChange={handleChange} className="w-full px-5 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-black text-sm text-indigo-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all lowercase" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1 italic">Contraseña Master</label>
                                <input type="password" name="password" placeholder="••••••••" required onChange={handleChange} className="w-full px-5 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-black text-sm text-indigo-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs">
                        {loading ? 'Inicializando Nube...' : '🚀 Lanzar mi Negocio Ahora'}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">¿Ya eres cliente? <span onClick={() => navigate('/login')} className="text-indigo-600 cursor-pointer hover:underline">Iniciar Sesión</span></p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroSaaS;
