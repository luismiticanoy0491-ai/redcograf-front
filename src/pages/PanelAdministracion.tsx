import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginAdministracion from './LoginAdministracion';

function PanelAdministracion() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const esSuperAdmin = localStorage.getItem('adminRole') === 'superadmin';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <LoginAdministracion onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="fade-in admin-hub-container">
      
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Panel de Administración Global</h1>
          <p>Centro de mando para estadísticas, inventario pesado y configuración corporativa.</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            border: 'none',
            color: 'white',
            padding: '0.8rem 1.8rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '1.2rem',
            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)',
            transition: 'transform 0.2s, background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
             e.currentTarget.style.background = '#dc2626';
             e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
             e.currentTarget.style.background = '#ef4444';
             e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🛑 SALIR Y CERRAR SESIÓN
        </button>
      </div>
      
      <div className="admin-section">
        {esSuperAdmin && (
           <>
              <h2 className="admin-section-title" style={{ color: '#ec4899' }}>👑 Portal del Creador (SaaS Central)</h2>
              <div className="admin-grid" style={{ marginBottom: '2rem' }}>
                <Link to="/superadmin" className="admin-card" style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: 'white' }}>
                  <div className="admin-icon-wrapper">🌍</div>
                  <h3 style={{ color: 'white' }}>Súper Administrador Global</h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)' }}>Monitorea el registro SaaS automático, pagos en Wompi y el recaudo mensual de todas las tiendas dueñas.</p>
                  <div className="admin-card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>Ver Matrix de Rentabilidad <span>&rarr;</span></div>
                </Link>
              </div>
           </>
        )}

        <h2 className="admin-section-title">📊 Inteligencia y Finanzas</h2>
        <div className="admin-grid">
          
          <Link to="/dashboard" className="admin-card grad-finance">
            <div className="admin-icon-wrapper">📈</div>
            <h3>Dashboard y Finanzas</h3>
            <p>Visión global del estado de tu mercancía, capital invertido y reportes contables generales.</p>
            <div className="admin-card-footer">Entrar al Cuadro de Mando <span>&rarr;</span></div>
          </Link>

          <Link to="/ai" className="admin-card grad-ai">
            <div className="admin-icon-wrapper">🤖</div>
            <h3>Predicciones Automáticas (AI)</h3>
            <p>Motor de Análisis Inteligente para predecir faltantes y calcular qué debes comprar el próximo mes.</p>
            <div className="admin-card-footer">Consultar Oráculo AI <span>&rarr;</span></div>
          </Link>
          
          <Link to="/reportes" className="admin-card grad-finance">
            <div className="admin-icon-wrapper">🧾</div>
            <h3>Reportes de Ventas Diarios</h3>
            <p>Exporta Excel, cuadra las cajas y revisa cuánto dinero en efectivo y tarjetas ingresó por cada cajero.</p>
            <div className="admin-card-footer">Ver Cortes de Caja <span>&rarr;</span></div>
          </Link>

          <Link to="/facturas" className="admin-card grad-finance">
            <div className="admin-icon-wrapper">🏷️</div>
            <h3>Auditoría de Recibos</h3>
            <p>Control de todos los tickets impresos, re-impresiones de ventas viejas y opción de anulación de ventas.</p>
            <div className="admin-card-footer">Ver Historial Tickets <span>&rarr;</span></div>
          </Link>

          <Link to="/separados" className="admin-card grad-ai" style={{ border: '2px solid #3b82f6' }}>
            <div className="admin-icon-wrapper">🛒</div>
            <h3>Separado de Productos</h3>
            <p>Sistema de abonos (Layaway) para compras a plazos. Reserva mercancía y abona poco a poco hasta saldar la cuenta.</p>
            <div className="admin-card-footer">Gestionar Separados <span>&rarr;</span></div>
          </Link>

        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">📦 Compras e Inventario Físico</h2>
        <div className="admin-grid">
          
          <Link to="/ingreso" className="admin-card grad-inv">
            <div className="admin-icon-wrapper">📥</div>
            <h3>Formulario de Lotes (Ingreso)</h3>
            <p>Registra compras completas, ingresa cajas de proveedores y captura códigos de barras nuevos a tu almacén.</p>
            <div className="admin-card-footer">Iniciar Ingreso Físico <span>&rarr;</span></div>
          </Link>
          
          <Link to="/compras" className="admin-card grad-inv">
            <div className="admin-icon-wrapper">📚</div>
            <h3>Histórico de Compras (Edición)</h3>
            <p>Navega a través del tiempo sobre tus remisiones de proveedor pasadas y edítalas con el motor retroactivo de recalculo.</p>
            <div className="admin-card-footer">Ver Historial Proveedor <span>&rarr;</span></div>
          </Link>

          <Link to="/ajustes" className="admin-card grad-inv">
            <div className="admin-icon-wrapper">⚖️</div>
            <h3>Nivelación de Estantes</h3>
            <p>Ajuste de inventario ciego. Corrección forzada de sobrantes o mermas (robos) de tu vitrina principal.</p>
            <div className="admin-card-footer">Realizar Ajuste <span>&rarr;</span></div>
          </Link>

        </div>
      </div>

      <div className="admin-section" style={{marginBottom: '5rem'}}>
        <h2 className="admin-section-title">🏢 Base de Datos y Sistemas</h2>
        <div className="admin-grid">
          
          <Link to="/empresa" className="admin-card grad-sys">
            <div className="admin-icon-wrapper">⚙️</div>
            <h3>Configuración Empresa</h3>
            <p>Modifica el Razón Social, NIT/RUT, mensajes del ticket y configuración fiscal general tuya.</p>
            <div className="admin-card-footer">Editar Parámetros <span>&rarr;</span></div>
          </Link>

          <Link to="/cajeros" className="admin-card grad-sys">
            <div className="admin-icon-wrapper">🧑‍💼</div>
            <h3>RRHH: Cajeros y Personal</h3>
            <p>Permisos y control de todas las personas autorizadas a operar la Caja y Ventas.</p>
            <div className="admin-card-footer">Gestionar Personal <span>&rarr;</span></div>
          </Link>

          <Link to="/pagos" className="admin-card grad-finance">
            <div className="admin-icon-wrapper">💰</div>
            <h3>Pago de Nómina (Pagos)</h3>
            <p>Liquidación automática de salario base y comisiones por ventas para cada empleado.</p>
            <div className="admin-card-footer">Administrar Pagos <span>&rarr;</span></div>
          </Link>

          <Link to="/clientes" className="admin-card grad-sys">
            <div className="admin-icon-wrapper">👥</div>
            <h3>Fidelización Clientes</h3>
            <p>Lista de clientes frecuentes para la emisión de facturas o remisiones con nombre y cédula/NIT propio.</p>
            <div className="admin-card-footer">Directorio Clientes <span>&rarr;</span></div>
          </Link>

          <Link to="/proveedores" className="admin-card grad-sys">
            <div className="admin-icon-wrapper">🚛</div>
            <h3>Catálogo de Proveedores</h3>
            <p>Control de marcas, distribuidores e importadores ligados directamente a tus facturas de compra.</p>
            <div className="admin-card-footer">Directorio Proveedores <span>&rarr;</span></div>
          </Link>

        </div>
      </div>

    </div>
  );
}

export default PanelAdministracion;
