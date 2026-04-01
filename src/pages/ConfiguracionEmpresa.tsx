import React, { useState, useEffect } from "react";
import API from "../api/api";
import "./ConfiguracionEmpresa.css";

function ConfiguracionEmpresa() {
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
    resolucion: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    API.get("/empresa")
      .then(res => {
        if (res.data) {
          setFormData({
            nombre_empresa: res.data.nombre_empresa || "",
            nit: res.data.nit || "",
            direccion: res.data.direccion || "",
            telefono: res.data.telefono || "",
            correo: res.data.correo || "",
            resolucion: res.data.resolucion || ""
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    API.put("/empresa", formData)
      .then(res => {
        setSuccess(true);
        alert("¡Datos de empresa actualizados correctamente!\n\nEstos datos aparecerán directamente en los nuevos tickets de venta.");
      })
      .catch(err => alert("Error guardando la configuración."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="empresa-layout fade-in">
      <div className="empresa-header">
        <h2>Ajustes y Parámetros de la Empresa</h2>
        <p>Configura los datos fiscales y resoluciones oficiales. Éstos se imprimirán automáticamente en cada factura o ticket.</p>
      </div>

      <div className="empresa-form-card card">
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group half">
              <label>NOMBRE EMPRESA <span className="req">*</span></label>
              <input 
                type="text" 
                name="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={handleChange}
                placeholder="Ej: SUPERMERCADO EL CÓNDOR S.A"
                required
              />
            </div>
            <div className="form-group half">
              <label>CC. / NIT <span className="req">*</span></label>
              <input 
                type="text" 
                name="nit"
                value={formData.nit}
                onChange={handleChange}
                placeholder="Ej: NIT 900.123.456-0"
                required
              />
            </div>
          </div>

          <div className="form-group full">
            <label>DIRECCIÓN COMPLETA <span className="req">*</span></label>
            <input 
              type="text" 
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Carrera 45 # 12-34 Local 5, Ciudad"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>NÚMERO DE CELULAR / TELÉFONO</label>
              <input 
                type="text" 
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 300 123 4567"
              />
            </div>
            <div className="form-group half">
              <label>CORREO ELECTRÓNICO <span className="req">*</span></label>
              <input 
                type="email" 
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="contacto@miempresa.com"
                required
              />
            </div>
          </div>

          <div className="form-group full resolucion-container">
            <label>RESOLUCIÓN DE FACTURACIÓN (COLOMBIA) <span className="req">*</span></label>
            <p className="helper-text">Escribe el texto exacto otorgado por la DIAN (Números de resolución, autorización, prefijos y fecha de vigencia). Se mostrará al pie del ticket impreso.</p>
            <textarea 
              name="resolucion"
              value={formData.resolucion}
              onChange={handleChange}
              rows={4}
              placeholder="Ej: Resolución de Facturación POS No. 1876200000000 Fecha: 2026-01-01 Vence: 2027-01-01 al prefijo FV del 1 al 10000."
              required
            />
          </div>

          <div className="empresa-actions">
             <button type="submit" className={`btn-guardar-empresa ${success ? 'btn-success' : ''}`} disabled={loading}>
                {loading ? "Guardando..." : success ? "✅ Datos Registrados" : "💾 Guardar Configuración DIAN"}
             </button>
          </div>
        </form>
      </div>

      <div className="preview-zone card">
         <h3>👁️ Vista Previa del Ticket</h3>
         <div className="ticket-sketch">
            <div className="ts-header">
               <strong>{formData.nombre_empresa || "NOMBRE EMPRESA"}</strong>
               <p>{formData.nit || "CC/NIT"}</p>
               <p>{formData.direccion || "Dirección"}</p>
               <p>
                 {formData.telefono && <span>Cel: {formData.telefono}</span>}
                 {formData.telefono && formData.correo && <span> | </span>}
                 {formData.correo && <span>{formData.correo}</span>}
               </p>
            </div>
            <div className="ts-body">
               <p>-----------------------------------</p>
               <p>[ PRODUCTOS ]</p>
               <p>-----------------------------------</p>
            </div>
            <div className="ts-footer">
               <p style={{whiteSpace: 'pre-wrap'}}>{formData.resolucion || "=== RESOLUCIÓN DE FACTURACIÓN DIAN ==="}</p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default ConfiguracionEmpresa;
