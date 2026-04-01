import React, { useState, useEffect } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import "./Facturas.css"; // We will add a bit of CSS to match the mobile-friendly card style
import { FacturaVenta } from "../types";

function Facturas() {
  const [facturas, setFacturas] = useState<FacturaVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRapido, setFiltroRapido] = useState("Todas");
  const [empresa, setEmpresa] = useState<any>({});
  
  // Menu options state
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // Modal de Detalles
  const [modalDetalle, setModalDetalle] = useState<number | null>(null);
  const [detallesFactura, setDetallesFactura] = useState<any[]>([]);

  // Estado para Imprimir
  const [facturaPrintData, setFacturaPrintData] = useState<{cabecera: FacturaVenta, detalles: any[]} | null>(null);

  useEffect(() => {
    if (facturaPrintData) {
      // Trigger print after DOM has updated to show the hidden receipt
      setTimeout(() => {
        window.print();
        setFacturaPrintData(null);
      }, 300);
    }
  }, [facturaPrintData]);

  const handleImprimirVenta = (f: FacturaVenta) => {
    API.get(`/ventas/${f.id}`)
      .then(res => {
        setFacturaPrintData({ cabecera: f, detalles: res.data });
        setMenuOpenId(null);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchFacturas();
    API.get("/empresa").then(res => setEmpresa(res.data)).catch(console.error);
  }, []);

  const fetchFacturas = () => {
    setLoading(true);
    API.get("/ventas")
      .then(res => {
        setFacturas(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const procesarBorrado = (id: number) => {
    if (!window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que deseas ANULAR la factura #${id}? Esta acción devolverá los productos al inventario y eliminará el registro monetario irreversiblemente.`)) return;

    API.delete(`/ventas/${id}`)
      .then(res => {
        if (res.data.success) {
          alert("✅ " + res.data.message);
          fetchFacturas(); // Recargar
        }
      })
      .catch(err => {
        console.error(err);
        alert("❌ Hubo un error al intentar anular la factura.");
      });
  };

  const verDetalles = (id: number) => {
    API.get(`/ventas/${id}`)
      .then(res => {
        setDetallesFactura(res.data);
        setModalDetalle(id);
        setMenuOpenId(null);
      })
      .catch(console.error);
  };

  const toggleMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (menuOpenId === id) setMenuOpenId(null);
    else setMenuOpenId(id);
  };

  const closeMenu = () => {
    if (menuOpenId) setMenuOpenId(null);
  };

  // Filtrado
  const facturasFiltradas = facturas.filter((f: FacturaVenta) => {
    const termLower = searchTerm.toLowerCase();
    const matchSearch = 
      (f.cliente && f.cliente.toLowerCase().includes(termLower)) || 
      (f.id.toString().includes(termLower));
      
    let matchFilter = true;
    if (filtroRapido === "Efectivo") matchFilter = f.metodo_pago === "Efectivo";
    if (filtroRapido === "Transferencia") matchFilter = f.metodo_pago === "Transferencia";

    return matchSearch && matchFilter;
  });

  return (
    <div className="facturas-container fade-in" onClick={closeMenu}>
      <div className="no-print">
        <div className="facturas-header-section">        
        {/* BUSCADOR */}
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por cliente o factura..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* FILTROS RÁPIDOS */}
        <div className="fast-filters">
          <button 
            className={`filter-pill ${filtroRapido === "Todas" ? "active" : ""}`} 
            onClick={() => setFiltroRapido("Todas")}
          >
            Todas
          </button>
          <button 
            className={`filter-pill ${filtroRapido === "Efectivo" ? "active" : ""}`} 
            onClick={() => setFiltroRapido("Efectivo")}
          >
            Pagadas
          </button>
          <button 
            className={`filter-pill ${filtroRapido === "Transferencia" ? "active" : ""}`} 
            onClick={() => setFiltroRapido("Transferencia")}
          >
            Pendientes
          </button>
        </div>

        <div className="results-count">
          <span className="results-title">Facturas Recientes</span>
          <span className="results-number">{facturasFiltradas.length} resultados</span>
        </div>
      </div>

      <div className="facturas-list">
        {loading ? (
          <p style={{textAlign: 'center', padding: '2rem'}}>Cargando historial...</p>
        ) : facturasFiltradas.length === 0 ? (
          <p style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No se encontraron facturas con esos criterios.</p>
        ) : (
          facturasFiltradas.map((f: FacturaVenta) => {
            const dateObj = new Date(f.fecha);
            const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return (
              <div key={f.id} className="factura-card">
                
                <div className="factura-card-header">
                  <div>
                    <h3 className="card-client-name">{f.cliente || "Cliente Casual"}</h3>
                    <span className="card-invoice-id">INV-{dateObj.getFullYear()}-{(f.id).toString().padStart(4, '0')}</span>
                  </div>
                  <div className="menu-container">
                    <button className="menu-dot-btn" onClick={(e) => toggleMenu(e, f.id)}>
                      <span className="dots">⋮</span>
                    </button>
                    {menuOpenId === f.id && (
                      <div className="menu-dropdown fade-in">
                        <button className="menu-item" onClick={() => verDetalles(f.id)}>
                          <span>✏️</span> Ver/Editar Detalles
                        </button>
                        <button className="menu-item" onClick={() => handleImprimirVenta(f)}>
                          <span>📤</span> Compartir (Imprimir)
                        </button>
                        <button className="menu-item danger" onClick={() => procesarBorrado(f.id)}>
                          <span>🗑️</span> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="factura-card-body">
                  <div className="left-data">
                    <span className="data-label">FECHA DE EMISIÓN</span>
                    <span className="data-value">{dateStr}</span>
                  </div>
                  <div className="right-data">
                    <span className="invoice-total">{formatCOP(f.total)}</span>
                    <span className="status-badge" style={f.metodo_pago === 'Efectivo' ? {backgroundColor: '#e0f2fe', color: '#0369a1'} : {backgroundColor: '#cffafe', color: '#0891b2'}}>
                      {f.metodo_pago === 'Efectivo' ? 'PAGADA' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {modalDetalle && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{maxWidth: '500px'}}>
            <h2>Detalles de la Factura #{modalDetalle}</h2>
            <div style={{marginTop: '1.5rem', marginBottom: '1.5rem'}}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant</th>
                    <th>Precio Uni.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesFactura.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{d.nombre}</strong>
                        {d.referencia && <div style={{fontSize: '0.8rem', color: '#666'}}>{d.referencia}</div>}
                      </td>
                      <td>{d.cantidad}</td>
                      <td>{formatCOP(d.precio_unitario)}</td>
                      <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{formatCOP(d.cantidad * d.precio_unitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: '#0f172a', fontWeight: 'bold' }} 
                onClick={() => {
                  const f = facturas.find(fac => fac.id === modalDetalle);
                  if (f) {
                    setFacturaPrintData({ cabecera: f, detalles: detallesFactura });
                  }
                }}
              >
                🖨️ Imprimir Recibo
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setModalDetalle(null)}>Cerrar Detalles</button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante */}
      <button className="floating-add-btn" onClick={() => window.location.href="/"}>+</button>
      </div>

      {facturaPrintData && (
        <div className="printable-receipt print-only fade-in" style={{fontFamily: 'monospace', color: 'black'}}>
          <div className="receipt-header print-only" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{empresa.nombre_empresa || "MI EMPRESA"}</h2>
            <h4 style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>RECIBO DE CAJA VOLANTE</h4>
            {empresa.nit && <p style={{ fontSize: '0.9rem', margin: '0' }}>NIT: {empresa.nit}</p>}
            <p style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold' }}>No responsable de IVA</p>
            {empresa.direccion && <p style={{ fontSize: '0.85rem', margin: '0' }}>Dir: {empresa.direccion}</p>}
            <p style={{ fontSize: '0.85rem', margin: '0' }}>
               {empresa.telefono && <span>Cel: {empresa.telefono}</span>}
               {empresa.telefono && empresa.correo && <span> | </span>}
               {empresa.correo && <span>Correo: {empresa.correo}</span>}
            </p>
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
            <p style={{ fontSize: '0.9rem', margin: '0' }}>Ticket No. {facturaPrintData.cabecera.id}</p>
            <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
          </div>
          
          <table style={{ width: '100%', fontSize: '12px', marginBottom: '1rem', borderCollapse: 'collapse' }}>
            <thead style={{ borderBottom: '1px dashed black', borderTop: '1px dashed black' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Cant</th>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Itm</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {facturaPrintData.detalles.map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 0', verticalAlign: 'top' }}>{d.cantidad}</td>
                  <td style={{ padding: '4px 0' }}>
                     <div>{d.nombre}</div>
                     {d.referencia && <div style={{fontSize: '10px'}}>{d.referencia}</div>}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 0', verticalAlign: 'top' }}>{formatCOP(d.cantidad * d.precio_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="print-only">------------------------------------</p>

          <div style={{ paddingTop: '5px', marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
              <span>TOTAL:</span>
              <span>{formatCOP(facturaPrintData.cabecera.total)}</span>
            </div>
            
            <div className="print-only" style={{ marginTop: '1.5rem', fontSize: '12px', textAlign: 'left' }}>
              <p style={{ margin: '4px 0' }}><strong>Fecha Original:</strong> {new Date(facturaPrintData.cabecera.fecha).toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>Forma de pago:</strong> {facturaPrintData.cabecera.metodo_pago}</p>
              <p style={{ margin: '4px 0' }}><strong>Cliente:</strong> {facturaPrintData.cabecera.cliente || "Casual"}</p>
              <p style={{ margin: '4px 0' }}><strong>Cajero Vendedor:</strong> {facturaPrintData.cabecera.cajero || "Principal"}</p>
              
              <div style={{ margin: '15px 0 5px 0', borderTop: '1px dashed #ccc', paddingTop: '10px', whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: '11px' }}>
                {empresa.resolucion || "Resolución DIAN Autorizada"}
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>¡Gracias por su compra!</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Facturas;
