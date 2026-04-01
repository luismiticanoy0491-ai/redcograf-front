import React, { useState, useEffect } from "react";
import API from "../api/api";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({ nombre: "", documento: "", telefono: "", correo: "", direccion: "" });

  const fetchClientes = () => {
    API.get("/clientes").then(res => setClientes(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) return alert("El nombre es obligatorio");
    try {
      const dataToSubmit = { 
        ...formData, 
        correo: formData.correo.trim() === "" ? "nna" : formData.correo 
      };
      await API.post("/clientes", dataToSubmit);
      setFormData({ nombre: "", documento: "", telefono: "", correo: "", direccion: "" });
      fetchClientes();
    } catch (error) {
      alert("Error registrando cliente");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar cliente del sistema?")) return;
    try {
      await API.delete(`/clientes/${id}`);
      fetchClientes();
    } catch (error) {
      alert("Error eliminando cliente");
    }
  };

  return (
    <div className="fade-in">
      <div className="header-section">
        <h2>Fidelización de Clientes (CRM)</h2>
        <p>Registra a tus compradores frecuentes para facturaciones exactas e historiales.</p>
      </div>

      <div className="grid-container">
        <div className="card form-card">
          <h3>Inscribir Cliente</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Nombre Completo / Razón Social</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required /></div>
            <div className="form-group"><label>Cédula / NIT</label><input type="text" name="documento" value={formData.documento} onChange={handleChange} /></div>
            <div className="form-group"><label>Teléfono (WhatsApp)</label><input type="text" name="telefono" value={formData.telefono} onChange={handleChange} /></div>
            <div className="form-group"><label>Dirección</label><input type="text" name="direccion" value={formData.direccion} onChange={handleChange} /></div>
            <div className="form-group"><label>Correo Electrónico (Opcional)</label><input type="text" name="correo" value={formData.correo} onChange={handleChange} placeholder="Ej. nna si no tiene" /></div>
            <button type="submit" className="btn-primary full-width" style={{marginTop: '1rem'}}>⭐ Guardar Cliente</button>
          </form>
        </div>

        <div className="card table-card">
          <h3>Cartera de Clientes ({clientes.length})</h3>
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Nombre</th><th>Documento</th><th>Contacto</th><th>Dirección</th><th>Acción</th></tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td style={{fontWeight: 'bold'}}>{c.nombre}</td>
                    <td>{c.documento || "N/A"}</td>
                    <td style={{fontSize: '0.85rem'}}>{c.telefono}<br/>{c.correo}</td>
                    <td style={{fontSize: '0.85rem'}}>{c.direccion || "N/A"}</td>
                    <td><button className="btn-secondary" style={{color: 'var(--danger)', border: 'none'}} onClick={() => handleDelete(c.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clientes;
