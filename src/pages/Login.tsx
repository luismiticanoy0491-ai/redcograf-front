import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api'; // Suponiendo que API es una instancia configurada de axios

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
        // Flujo de Registro
        await API.post('/auth/registro', formData);
        alert('🎉 Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setMode('login'); // Cambiar a vista de login automáticamente
        setFormData({ ...formData, password: '' });
      } else if (mode === 'recover') {
        // Flujo de Recuperación
        await API.post('/auth/recuperar', {
          username: formData.username,
          correo: formData.correo,
          newPassword: formData.password
        });
        alert('🔑 Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.');
        setMode('login');
        setFormData({ ...formData, password: '' });
      } else {
        // Flujo de Login
        const response = await API.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });

        // Guardar token y rol
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminRole', response.data.role);
        localStorage.setItem('adminUser', response.data.username);

        // Redirigir al terminal POS General
        navigate('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Ocurrió un error inesperado al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box card focus-glow fade-in">
        <div className="login-header">
          <span className="logo-icon" style={{ fontSize: '3rem', display: 'block', textAlign: 'center' }}>📦</span>
          <h1 style={{ textAlign: 'center', margin: '10px 0', color: '#1e293b' }}>
            IMPULSA POS
          </h1>
          <p style={{ textAlign: 'center', color: '#64748b' }}>
            {mode === 'register' ? 'Crea una cuenta para empezar' : mode === 'recover' ? 'Restablece tu contraseña de forma segura' : 'Inicia sesión para acceder al sistema'}
          </p>
        </div>

        {error && (
          <div className="alert-error" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Usuario</label>
            <input
              type="text"
              name="username"
              placeholder="Ej. admin_local"
              value={formData.username}
              onChange={handleChange}
              required
              className="styled-input"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {(mode === 'register' || mode === 'recover') && (
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                {mode === 'recover' ? 'Correo de Recuperación' : 'Correo Electrónico (Opcional)'}
              </label>
              <input
                type="email"
                name="correo"
                placeholder="tucorreo@empresa.com"
                value={formData.correo}
                onChange={handleChange}
                required={mode === 'recover'}
                className="styled-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              {mode === 'recover' ? 'Nueva Contraseña' : 'Contraseña'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="styled-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#64748b'
                }}
                title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem'
            }}
          >
            {loading ? 'Procesando...' : (mode === 'register' ? '✅ Registrarse' : mode === 'recover' ? '🔄 Restablecer' : '🚀 Iniciar Sesión')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('recover'); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            type="button"
            onClick={() => { setMode(mode === 'register' || mode === 'recover' ? 'login' : 'register'); setError(null); }}
            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Crear Cajero Local' : 'Volver a Iniciar Sesión'}
          </button>

          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.9rem' }}>¿Aún no usas nuestra plataforma?</p>
            <button
              type="button"
              onClick={() => navigate('/registro-saas')}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
            >
              🚀 Registra tu Negocio (7 Días Gratis)
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          background: #f8fafc;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        .login-box {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 450px;
        }
        .styled-input:focus {
          outline: none;
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Login;
