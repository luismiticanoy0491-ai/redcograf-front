import React, { useState } from 'react';
import API from '../api/api';
import './Login.css';

interface LoginAdministracionProps {
  onLoginSuccess?: () => void;
}

function LoginAdministracion({ onLoginSuccess }: LoginAdministracionProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await API.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        // Guardamos el token en localStorage para persistencia temporal
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', response.data.username);
        localStorage.setItem('adminRole', response.data.role);
        
        // Llamamos al método del padre para cambiar el estado de la app
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper fade-in">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">🛡️</div>
          <h2>Acceso Restringido</h2>
          <p>Panel de Administración Central</p>
        </div>
        
        {error && (
          <div className="login-alert error shake">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label>Usuario Master</label>
            <input 
              type="text" 
              placeholder="Ej. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="login-form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn-submit"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Solo personal autorizado. El acceso está siendo monitoreado de manera local.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginAdministracion;
