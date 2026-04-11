import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Productos from "./pages/Productos";
import IngresoProductos from "./pages/IngresoProductos";
import Cajeros from "./pages/Cajeros";
import PagosEmpleados from "./pages/PagosEmpleados";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import ConfiguracionEmpresa from "./pages/ConfiguracionEmpresa";
import Reportes from "./pages/Reportes";
import AjustesInventario from "./pages/AjustesInventario";
import VentasMayoristas from "./pages/VentasMayoristas";
import Facturas from "./pages/Facturas";
import FacturasCompra from "./pages/FacturasCompra";
import Dashboard from "./pages/Dashboard";
import PrediccionesAI from "./pages/PrediccionesAI";
import PanelAdministracion from "./pages/PanelAdministracion";
import Separados from "./pages/Separados";
import Login from "./pages/Login";
import RegistroSaaS from "./pages/RegistroSaaS";
import SuperAdminSaaS from "./pages/SuperAdminSaaS";
import InventarioAdmin from "./pages/InventarioAdmin";
import Kardex from "./pages/Kardex";
import "./index.css";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/login" replace />;
};

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isLoginPage = location.pathname === "/login" || location.pathname === "/registro-saas";

  if (isLoginPage) return null;

  const NavLink = ({ to, label, emoji, activeClass }: any) => (
    <Link 
      to={to} 
      onClick={() => setIsMenuOpen(false)}
      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${
        location.pathname === to 
          ? activeClass || "bg-slate-100 text-slate-900 shadow-sm" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className="text-lg">{emoji}</span>
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl">📦</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 leading-none uppercase tracking-tighter">IMPULSA POS</span>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Gestión Digital</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            <NavLink to="/" label="Venta General" emoji="🏪" />
            <NavLink to="/mayoristas" label="Mayoristas" emoji="🚛" activeClass="bg-sky-50 text-sky-700 border border-sky-100 shadow-sm" />
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <Link 
              to="/admin" 
              className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white shadow-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 uppercase tracking-widest"
            >
              🛡️ Administración
            </Link>

            <button
               onClick={() => {
                 const message = "Hola, requiero información o ayuda sobre Impulsa POS.";
                 window.open(`https://wa.me/573152796683?text=${encodeURIComponent(message)}`, '_blank');
               }}
               className="w-9 h-9 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-50 flex items-center justify-center text-lg font-black hover:bg-emerald-600 transition-all duration-300 ml-2"
               title="Soporte WhatsApp"
            >
               ❓
            </button>

            <Link 
              to="/empresa" 
              className="w-9 h-9 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-200 flex items-center justify-center text-lg font-black hover:bg-indigo-600 transition-all duration-300 ml-2"
              title="Perfil de Empresa"
            >
               🏢
            </Link>

            {localStorage.getItem('adminRole') === 'superadmin' && localStorage.getItem('adminEmpresaId') === '1' && (
              <button 
                onClick={() => {
                  const pass = prompt("🔑 Ingrese la Clave Maestra de Infraestructura:");
                  if (pass === "superimpulsa") {
                    window.location.href = "/superadmin";
                  } else {
                    alert("🚫 Clave Incorrecta. Acceso Denegado.");
                  }
                }}
                className="w-9 h-9 bg-pink-600 text-white rounded-lg shadow-lg shadow-pink-200 flex items-center justify-center text-lg font-black hover:bg-pink-700 transition-all duration-300 ml-2 animate-pulse"
                title="Panel SaaS Global"
              >
                 👑
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
             {isMenuOpen ? <span className="text-2xl">✕</span> : <span className="text-2xl">☰</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-2xl p-4 space-y-2 animate-in slide-in-from-top duration-300">
           <NavLink to="/" label="Venta General" emoji="🏪" />
           <NavLink to="/mayoristas" label="Distribución Mayorista" emoji="🚛" activeClass="bg-sky-50 text-sky-700 border border-sky-100 shadow-sm" />
           <NavLink to="/admin" label="Administración Central" emoji="🛡️" activeClass="bg-indigo-600 text-white ring-4 ring-indigo-50 shadow-lg shadow-indigo-200" />
           
           <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                 onClick={() => {
                   const message = "Hola, requiero información o ayuda sobre Impulsa POS.";
                   window.open(`https://wa.me/573152796683?text=${encodeURIComponent(message)}`, '_blank');
                   setIsMenuOpen(false);
                 }}
                 className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                 ❓ Soporte
              </button>
              <Link
                 to="/empresa"
                 onClick={() => setIsMenuOpen(false)}
                 className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                 🏢 Perfil
              </Link>
              {localStorage.getItem('adminRole') === 'superadmin' && (
                <Link
                   to="/superadmin"
                   onClick={() => setIsMenuOpen(false)}
                   className="px-4 py-3 bg-pink-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest col-span-2"
                >
                   👑 Panel SaaS Global
                </Link>
              )}
           </div>
        </div>
      )}
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <Navigation />
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro-saas" element={<RegistroSaaS />} />
            <Route path="/" element={<AdminRoute><Productos /></AdminRoute>} />
            <Route path="/mayoristas" element={<AdminRoute><VentasMayoristas /></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><PanelAdministracion /></AdminRoute>} />
            <Route path="/superadmin" element={<AdminRoute><SuperAdminSaaS /></AdminRoute>} />
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/ai" element={<AdminRoute><PrediccionesAI /></AdminRoute>} />
            <Route path="/ingreso" element={<AdminRoute><IngresoProductos /></AdminRoute>} />
            <Route path="/compras" element={<AdminRoute><FacturasCompra /></AdminRoute>} />
            <Route path="/cajeros" element={<AdminRoute><Cajeros /></AdminRoute>} />
            <Route path="/pagos" element={<AdminRoute><PagosEmpleados /></AdminRoute>} />
            <Route path="/clientes" element={<AdminRoute><Clientes /></AdminRoute>} />
            <Route path="/proveedores" element={<AdminRoute><Proveedores /></AdminRoute>} />
            <Route path="/empresa" element={<AdminRoute><ConfiguracionEmpresa /></AdminRoute>} />
            <Route path="/ajustes" element={<AdminRoute><AjustesInventario /></AdminRoute>} />
            <Route path="/facturas" element={<AdminRoute><Facturas /></AdminRoute>} />
            <Route path="/reportes" element={<AdminRoute><Reportes /></AdminRoute>} />
            <Route path="/separados" element={<AdminRoute><Separados /></AdminRoute>} />
            <Route path="/inventario-global" element={<AdminRoute><InventarioAdmin /></AdminRoute>} />
            <Route path="/kardex" element={<AdminRoute><Kardex /></AdminRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
