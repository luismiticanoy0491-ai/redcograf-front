import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="logo-icon">📦</span>
            <h1>IMPULSA POS 🏪</h1>
          </div>
          <div className="nav-links" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link to="/" className="nav-btn" style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>🏪 Terminal General</Link>
            <Link to="/mayoristas" className="nav-btn" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>📦 Terminal Mayorista</Link>
            <Link to="/admin" className="nav-btn fade-in" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 'bold', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}>🛡️ Panel de Administración Central</Link>
          </div>
        </nav>
        <main className="main-content">
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
