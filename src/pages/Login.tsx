import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api'; 

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [formData, setFormData] = useState({
    username: '',
    correo: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await API.post('/auth/registro', formData);
        alert('🎉 Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setMode('login');
        setFormData({ ...formData, password: '' });
      } else if (mode === 'recover') {
        await API.post('/auth/recuperar', {
          username: formData.username,
          correo: formData.correo,
          newPassword: formData.password
        });
        alert('🔑 Contraseña restablecida correctamente.');
        setMode('login');
        setFormData({ ...formData, password: '' });
      } else {
        const response = await API.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });

        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminRole', response.data.role);
        localStorage.setItem('adminUser', response.data.username);

        navigate('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Error al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 overflow-y-auto p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500 my-auto">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 pb-4">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 mb-3 transform hover:rotate-12 transition-transform duration-300">
                <span className="text-2xl text-white">📦</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-900 mb-1">
                IMPULSA POS
              </h1>
              <p className="text-slate-400 text-center text-[10px] font-black uppercase tracking-widest leading-loose">
                {mode === 'register' ? 'Crea una cuenta' : mode === 'recover' ? 'Recupera acceso' : 'Control de Punto de Venta'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
                <span className="text-red-500 text-xs">⚠️</span>
                <p className="text-[11px] font-bold text-red-600 leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
                <div className="relative group">
                  <input
                    type="text"
                    name="username"
                    placeholder="Tu usuario"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-300 font-bold text-sm"
                  />
                </div>
              </div>

              {(mode === 'register' || mode === 'recover') && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="correo"
                    placeholder="email@empresa.com"
                    value={formData.correo}
                    onChange={handleChange}
                    required={mode === 'recover'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-300 font-bold text-sm lowercase"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {mode === 'recover' ? 'Nueva Contraseña' : 'Contraseña'}
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100/30 focus:border-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-300 font-bold text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 text-xs uppercase tracking-widest"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>{mode === 'register' ? 'Registrarse' : mode === 'recover' ? 'Restablecer' : 'Entrar al Sistema'}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('recover'); setError(null); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              <button
                type="button"
                onClick={() => { setMode(mode === 'register' || mode === 'recover' ? 'login' : 'register'); setError(null); }}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
              >
                {mode === 'login' ? 'Crear Cuenta Local' : 'Volver al Login'}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100">
            <div className="text-center space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">¿Nuevo negocio? Usa la nube.</p>
              <button
                type="button"
                onClick={() => navigate('/registro-saas')}
                className="w-full py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-xl shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                🚀 Registrar Empresa <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse uppercase">Gratis</span>
              </button>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">
          &copy; 2026 IMPULSA POS
        </p>
      </div>
    </div>
  );
};

export default Login;