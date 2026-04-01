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
import "./index.css";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/login" replace />;
};

const Navigation = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/registro-saas";

  if (isLoginPage) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl">📦</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 leading-none">IMPULSA POS</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Gestión Inteligente</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                location.pathname === "/" 
                  ? "bg-slate-100 text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              🏪 Terminal General
            </Link>
            <Link 
              to="/mayoristas" 
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                location.pathname === "/mayoristas" 
                  ? "bg-sky-50 text-sky-700 shadow-sm border border-sky-100" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              📦 Terminal Mayorista
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <Link 
              to="/admin" 
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2"
            >
              🛡️ Administración Central
            </Link>
          </div>

          <div className="md:hidden">
             {/* Simple mobile menu trigger or icon could go here */}
             <span className="text-2xl">☰</span>
          </div>
        </div>
      </div>
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
