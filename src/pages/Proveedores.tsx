import React, { useState, useEffect } from "react";
import API from "../api/api";
import "./Proveedores.css";

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [formData, setFormData] = useState({
    nombre_comercial: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = () => {
    API.get("/proveedores")
      .then(res => setProveedores(res.data))
      .catch(console.error);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    API.post("/proveedores", formData)
      .then(res => {
        alert("¡Proveedor integrado a la cadena de suministro!");
        setFormData({ nombre_comercial: "", nit: "", direccion: "", telefono: "", correo: "" });
        fetchProveedores();
      })
      .catch(err => {
        alert("Error creando proveedor.");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  const handleCancel = () => {
    setFormData({ nombre_comercial: "", nit: "", direccion: "", telefono: "", correo: "" });
  };

  return (
    <div className="proveedores-layout fade-in">
      {/* Top Header */}
      <div className="top-nav-header">
        <button className="back-button" onClick={() => window.history.back()}>
          &#8592; <span>Agregar Proveedor</span>
        </button>
      </div>

      <div className="content-wrapper">
        
        {/* Lado izquierdo: Formulario de Diseño Específico */}
        <div className="form-container-side">
          <div className="form-titles">
            <span className="subtitle">DIRECTORIO LOGÍSTICO</span>
            <h1 className="main-title">Nuevo Proveedor</h1>
            <p className="description">
              Complete la información detallada para integrar un nuevo aliado comercial a su cadena de suministro.
            </p>
          </div>

          <div className="card form-box">
            <form onSubmit={handleSubmit}>
              
              <div className="input-block">
                <label>NOMBRE COMERCIAL</label>
                <input 
                  type="text" 
                  name="nombre_comercial"
                  value={formData.nombre_comercial}
                  onChange={handleChange}
                  placeholder="Ej. Corporación Logística Global" 
                  required
                />
              </div>

              <div className="input-block">
                <label>NIT / ID FISCAL</label>
                <input 
                  type="text" 
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  placeholder="900.123.456-7" 
                />
              </div>

              <div className="input-block">
                <label>DIRECCIÓN DE OPERACIONES</label>
                <textarea 
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Calle Principal #45-12, Zona Industrial Sur" 
                />
              </div>

              <div className="input-block has-icon">
                <label>TELÉFONO DE CONTACTO</label>
                <div className="input-icon-wrapper">
                  <span className="icon">📞</span>
                  <input 
                    type="text" 
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+57 300 000 0000" 
                  />
                </div>
              </div>

              <div className="input-block has-icon">
                <label>CORREO ELECTRÓNICO</label>
                <div className="input-icon-wrapper">
                  <span className="icon">✉️</span>
                  <input 
                    type="email" 
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="contacto@proveedor.com" 
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="action-buttons-container">
                <button type="button" className="action-btn cancel-btn" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="submit" className="action-btn save-btn" disabled={isLoading}>
                  <span>💾</span> Guardar Proveedor
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Lado derecho: Lista de Proveedores Registrados */}
        <div className="list-container-side">
          <div className="list-header">
            <h3>Aliados Comerciales ({proveedores.length})</h3>
          </div>
          <div className="proveedores-grid">
            {proveedores.length === 0 ? (
              <p style={{color: '#64748b'}}>No hay proveedores registrados aún.</p>
            ) : (
              proveedores.map(prov => (
                <div key={prov.id} className="prov-card">
                  <h4>{prov.nombre_comercial}</h4>
                  <div className="prov-details">
                    <p><strong>NIT:</strong> {prov.nit || "N/A"}</p>
                    <p><strong>📌</strong> {prov.direccion || "Sin dirección"}</p>
                    <p><strong>📞</strong> {prov.telefono || "Sin teléfono"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Proveedores;
