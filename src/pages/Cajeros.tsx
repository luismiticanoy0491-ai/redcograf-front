import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function Cajeros() {
  const [cajeros, setCajeros] = useState([]);
  
  // States for form
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    direccion: "",
    fecha_contrato: "",
    salario: "",
    paga_comisiones: false,
    porcentaje_comision: ""
  });

  const fetchCajeros = () => {
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchCajeros();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: "", documento: "", telefono: "", direccion: "",
      fecha_contrato: "", salario: "", paga_comisiones: false, porcentaje_comision: ""
    });
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      nombre: c.nombre || "",
      documento: c.documento || "",
      telefono: c.telefono || "",
      direccion: c.direccion || "",
      fecha_contrato: c.fecha_contrato ? c.fecha_contrato.split('T')[0] : "",
      salario: c.salario || "",
      paga_comisiones: c.paga_comisiones === 1 || c.paga_comisiones === true,
      porcentaje_comision: c.porcentaje_comision || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) return alert("Nombre obligatorio");
    
    try {
      if (editingId) {
        await API.put(`/cajeros/${editingId}`, formData);
        alert("✅ Perfil de empleado actualizado");
      } else {
        await API.post("/cajeros", formData);
        alert("✅ Cajero registrado como nuevo empleado");
      }
      resetForm();
      fetchCajeros();
    } catch (error) {
      console.error(error);
      alert("Error guardando el registro del cajero: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ ¿Eliminar permanentemente a este empleado del sistema?")) return;
    try {
      await API.delete(`/cajeros/${id}`);
      fetchCajeros();
    } catch (error) {
      alert("Error eliminando empleado");
    }
  };

  return (
    <div className="fade-in" style={{ padding: '0 1rem' }}>
      <div className="header-section">
        <h2>Recursos Humanos: Personal y Comisiones</h2>
        <p>Administra los perfiles, nómina básica y esquemas de comisión de tu equipo autorizado para operar cajas.</p>
      </div>

      <div className="grid-container" style={{gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start'}}>
        <div className="card form-card">
          <h3 style={{marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a'}}>
            {editingId ? "✏️ Editando Perfil de Empleado" : "➕ Registrar Empleado"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Ana Pérez" required />
            </div>
            
            <div className="form-group" style={{marginTop: '0.5rem'}}>
              <label>Documento de Identidad</label>
              <input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder="CC o NIT" />
            </div>
            
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
              <div className="form-group" style={{flex: 1}}>
                <label>Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Móvil" />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>F. Contratación</label>
                <input type="date" name="fecha_contrato" value={formData.fecha_contrato} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group" style={{marginTop: '0.5rem'}}>
              <label>Dirección de Residencia</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección completa" />
            </div>

            <div className="form-group" style={{marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0'}}>
              <label style={{color: '#0f172a', fontWeight: 'bold'}}>💰 Salario a Pagar (Mensual/Quincenal)</label>
              <input 
                 type="number" 
                 name="salario" 
                 value={formData.salario} 
                 onChange={handleChange} 
                 placeholder="Ej. 1500000" 
                 style={{fontSize: '1.1rem', backgroundColor: '#f0f9ff', borderColor: '#bae6fd'}} 
              />
            </div>

            <div className="form-group" style={{marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#166534', cursor: 'pointer', margin: 0}}>
                <input type="checkbox" name="paga_comisiones" checked={formData.paga_comisiones} onChange={handleChange} style={{width: 'auto', accentColor: '#16a34a'}} />
                Activar Pago de Comisiones
              </label>
              
              {formData.paga_comisiones && (
                <div style={{marginTop: '0.8rem', animation: 'fadeIn 0.3s'}}>
                  <label style={{color: '#64748b', fontSize: '0.85rem'}}>Porcentaje (%) sobre la venta:</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <input type="number" step="0.1" name="porcentaje_comision" value={formData.porcentaje_comision} onChange={handleChange} style={{flex: 1}} placeholder="Ej. 5.0" />
                    <span style={{fontWeight: 'bold', color: '#64748b'}}>%</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem'}}>
              {editingId && (
                 <button type="button" className="btn-secondary" style={{flex: 1}} onClick={resetForm}>Cancelar</button>
              )}
              <button type="submit" className="btn-primary" style={{flex: editingId ? 1 : '1 1 auto', backgroundColor: editingId ? '#0ea5e9' : ''}}>
                {editingId ? "💾 Guardar Cambios" : "+ Cargar a Nómina"}
              </button>
            </div>
          </form>
        </div>

        <div className="card table-card" style={{overflowX: 'auto', backgroundColor: 'white'}}>
          <h3 style={{marginBottom: '1rem', color: '#0f172a'}}>Nómina y Personal Activo ({cajeros.length})</h3>
          <table className="modern-table" style={{minWidth: '600px'}}>
            <thead>
               <tr>
                 <th>Empleado</th>
                 <th>Contacto</th>
                 <th>Contratación</th>
                 <th>Salario Base</th>
                 <th style={{textAlign: 'center'}}>Comisiones</th>
                 <th style={{textAlign: 'center'}}>Gestión</th>
               </tr>
            </thead>
            <tbody>
              {cajeros.map(c => (
                <tr key={c.id} className="row-hover">
                  <td>
                    <div style={{fontWeight: '900', color: '#0f172a', fontSize: '1rem'}}>{c.nombre}</div>
                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>ID: {c.documento || "N/A"}</div>
                  </td>
                  <td style={{fontSize: '0.85rem'}}>
                    <div style={{fontWeight: 'bold', color: '#334155'}}>📞 {c.telefono || '-'}</div>
                    <div style={{color: '#64748b', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={c.direccion}>{c.direccion || '-'}</div>
                  </td>
                  <td style={{fontSize: '0.85rem', color: '#475569'}}>
                    {c.fecha_contrato ? new Date(c.fecha_contrato).toLocaleDateString() : <span style={{color: '#94a3b8'}}>No definida</span>}
                  </td>
                  <td style={{fontWeight: 'bold', color: '#0369a1'}}>
                    {c.salario > 0 ? formatCOP(c.salario) : <span style={{color: '#94a3b8'}}>-</span>}
                  </td>
                  <td style={{textAlign: 'center'}}>
                    {c.paga_comisiones ? (
                       <span style={{backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold'}}>
                         Sí ({c.porcentaje_comision}%)
                       </span>
                    ) : (
                       <span style={{backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem'}}>
                         No
                       </span>
                    )}
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                       <button className="btn-secondary" style={{padding: '0.3rem 0.6rem', color: '#0ea5e9', borderColor: '#0ea5e9', backgroundColor: 'transparent'}} onClick={() => handleEdit(c)} title="Editar Empleado">✏️</button>
                       <button className="btn-secondary" style={{padding: '0.3rem 0.6rem', color: '#ef4444', borderColor: '#ef4444', backgroundColor: '#fef2f2'}} onClick={() => handleDelete(c.id)} title="Dar de baja">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {cajeros.length === 0 && <tr><td colSpan={6} className="text-center" style={{padding: '3rem', color: '#94a3b8'}}>No hay personal registrado en el sistema.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Cajeros;
