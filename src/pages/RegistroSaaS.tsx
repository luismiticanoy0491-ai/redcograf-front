import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './RegistroSaaS.css';

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
      
      // Auto-login post registro
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
    <div className="saas-register-container">
      <div className="saas-register-card">
        <div className="saas-brand">
          <span className="saas-logo">🚀</span>
          <h2>Únete a IMPULSA POS</h2>
          <p>Obtén <strong>7 días gratis</strong> con acceso total. Sin tarjeta de crédito.</p>
        </div>

        {error && <div className="saas-error">{error}</div>}

        <form onSubmit={handleRegister} className="saas-form">
          <div className="saas-input-group">
            <span className="input-icon">🏪</span>
            <input type="text" name="nombre_comercial" placeholder="Nombre de tu Negocio *" required onChange={handleChange} />
          </div>

          <div className="saas-row">
            <div className="saas-input-group">
              <span className="input-icon">📄</span>
              <input type="text" name="niti" placeholder="NIT / RUT (Opcional)" onChange={handleChange} />
            </div>
            <div className="saas-input-group">
              <span className="input-icon">📱</span>
              <input type="text" name="telefono" placeholder="Teléfono" onChange={handleChange} />
            </div>
          </div>

          <div className="saas-input-group">
            <span className="input-icon">✉️</span>
            <input type="email" name="correo" placeholder="Correo Electrónico *" required onChange={handleChange} />
          </div>

          <div className="divider">Datos de Acceso</div>

          <div className="saas-input-group">
            <span className="input-icon">👤</span>
            <input type="text" name="username" placeholder="Usuario Administrador *" required onChange={handleChange} />
          </div>

          <div className="saas-input-group">
            <span className="input-icon">🔒</span>
            <input type="password" name="password" placeholder="Contraseña Segura *" required onChange={handleChange} />
          </div>

          <button type="submit" className="saas-submit-btn" disabled={loading}>
            {loading ? 'Creando tu Tienda...' : 'Comenzar Prueba Gratis'}
          </button>
        </form>

        <div className="saas-footer">
          <p>¿Ya tienes una cuenta? <span className="saas-link" onClick={() => navigate('/login')}>Inicia Sesión</span></p>
        </div>
      </div>
      <div className="saas-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
};

export default RegistroSaaS;
