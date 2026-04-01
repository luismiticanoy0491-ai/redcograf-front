import React, { useEffect, useState } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

function VentasMayoristas() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // POS States (Multi-Tab Core)
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem("posMayoristaTabs");
    return savedTabs ? JSON.parse(savedTabs) : [{ id: 1, carrito: [], clienteId: "1", clienteSearch: "" }];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    const savedActiveTab = localStorage.getItem("posMayoristaActiveTab");
    return savedActiveTab ? JSON.parse(savedActiveTab) : 1;
  });
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    localStorage.setItem("posMayoristaTabs", JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem("posMayoristaActiveTab", JSON.stringify(activeTabId));
  }, [activeTabId]);

  const carrito = activeTab.carrito;
  const clienteId = activeTab.clienteId;
  const clienteSearch = activeTab.clienteSearch;

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const setCarrito = (newCarrito) => updateActiveTab({ carrito: newCarrito });
  const setClienteId = (newId) => updateActiveTab({ clienteId: newId });
  const setClienteSearch = (newSearch) => updateActiveTab({ clienteSearch: newSearch });
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [pagoCliente, setPagoCliente] = useState("");
  
  // Mayorista States
  // Se maneja porcentaje de descuento de manera individual en cada item del carrito
  
  const [cajeros, setCajeros] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empresa, setEmpresa] = useState<any>({});
  const [cajeroId, setCajeroId] = useState(() => {
    return localStorage.getItem("posCajeroId") || "";
  });

  useEffect(() => {
    localStorage.setItem("posCajeroId", cajeroId);
  }, [cajeroId]);

  // Receipt Print State
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [facturaIdImpresion, setFacturaIdImpresion] = useState<number | null>(null);

  // Tab Handlers
  const nuevaTab = () => {
    const newId = Math.max(...tabs.map(t => t.id), 0) + 1;
    setTabs([...tabs, { id: newId, carrito: [], clienteId: "1", clienteSearch: "" }]);
    setActiveTabId(newId);
  };

  const cerrarTab = (id) => {
    if (tabs.length === 1) return;
    if (window.confirm("¿Seguro que deseas descartar este lote mayorista en espera?")) {
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs[0].id);
      }
    }
  };

  useEffect(() => {
    fetchInventory();
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
    API.get("/clientes").then(res => setClientes(res.data)).catch(console.error);
    API.get("/empresa").then(res => setEmpresa(res.data)).catch(console.error);
  }, []);

  const fetchInventory = () => {
    API.get("/productos")
      .then(res => {
        setProductos(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (p.referencia && p.referencia.toLowerCase().includes(search.toLowerCase()))
  );

  const agregarAlCarrito = (producto) => {
    // Se permite vender en negativo pero notificando al usuario
    const exist = carrito.find(x => x.id === producto.id);
    const newQty = exist ? exist.qty + 1 : 1;

    // Solo alerta visual en tabla, sin bloqueos
    if (exist) {
      setCarrito(carrito.map(x => x.id === producto.id ? { ...exist, qty: newQty } : x));
    } else {
      setCarrito([...carrito, { ...producto, qty: 1, descuento: 30 }]);
    }
  };

  const removerDelCarrito = (producto) => {
    const exist = carrito.find(x => x.id === producto.id);
    if (exist.qty === 1) {
      setCarrito(carrito.filter(x => x.id !== producto.id));
    } else {
      setCarrito(carrito.map(x => x.id === producto.id ? { ...exist, qty: exist.qty - 1 } : x));
    }
  };

  const eliminarDelCarrito = (producto) => {
    setCarrito(carrito.filter(x => x.id !== producto.id));
  };

  const vaciarCarrito = () => {
    if (window.confirm("¿Seguro que deseas vaciar el carrito actual?")) setCarrito([]);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      e.preventDefault();
      // Buscar coincidencia exacta por Referencia/SKU
      const matchedProduct = productos.find(p => 
        p.referencia && p.referencia.trim().toLowerCase() === search.trim().toLowerCase()
      );
      
      if (matchedProduct) {
        agregarAlCarrito(matchedProduct);
        setSearch(""); // Limpiar la barra para el siguiente escaneo
      } else {
        // En caso de que el código de barras o código ingresado no exista
        setScanError(true);
        setTimeout(() => setScanError(false), 800);
      }
    }
  };

  const handleDescuentoChange = (id, valor) => {
    let desc = parseFloat(valor) || 0;
    if (desc < 0) desc = 0;
    if (desc > 100) desc = 100;
    setCarrito(carrito.map(x => x.id === id ? { ...x, descuento: desc } : x));
  };

  // Wholesale Math
  const subtotalOriginal = carrito.reduce((a, c) => a + c.precio_venta * c.qty, 0);
  const granTotal = carrito.reduce((a, c) => a + (c.precio_venta * (1 - (c.descuento || 0) / 100)) * c.qty, 0);
  const valorDescuento = subtotalOriginal - granTotal;

  const cashPaga = parseFloat(pagoCliente) || 0;
  const vuelto = cashPaga - granTotal;

  const confirmarVenta = async () => {
    if (carrito.length === 0) return;
    if (!cajeroId) return alert("❌ Seguridad: Selecciona tu Cajero en Turno antes de operar la caja.");
    if (metodoPago === "Efectivo" && cashPaga < granTotal) {
      return alert("El efectivo ingresado es insuficiente para cubrir el total descontado de la compra.");
    }

    setIsProcessing(true);
    try {
      // Aplicar el descuento dinámicamente individualmente
      const discountedCart = carrito.map(item => ({
        ...item,
        precio_venta: item.precio_venta * (1 - (item.descuento || 0) / 100)
      }));

      const response = await API.post("/ventas", {
        items: discountedCart,
        metodoPago,
        efectivoEntregado: cashPaga,
        vuelto: vuelto > 0 ? vuelto : 0,
        cajeroId: parseInt(cajeroId),
        clienteId: clienteId ? parseInt(clienteId) : 1, // Default 1 (Cliente General)
        total: granTotal
      });
      setFacturaIdImpresion(response.data.factura_id);
      setVentaExitosa(true);
      fetchInventory(); 
    } catch (err) {
      console.error(err);
      alert("Error procesando la venta mayorista.");
    } finally {
      setIsProcessing(false);
    }
  };

  const imprimirYTerminar = () => {
    window.print();
    // Ya no limpiamos automáticamente para asegurar que el navegador tenga tiempo infinito de capturar el ticket.
  };

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clienteId)) || { nombre: "Cliente Casual de Contado" };
  const cajeroSeleccionado = cajeros.find(c => c.id === parseInt(cajeroId)) || { nombre: "Cajero Principal" };

  return (
    <div className="pos-layout fade-in">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="pos-catalog no-print">
        <div className="catalog-header" style={{backgroundColor: '#1e293b', color: 'white'}}>
          <h2 style={{color: '#38bdf8'}}>CAJA REGISTRADORA MAYORISTA</h2>
          <p style={{fontSize: '0.9rem', marginBottom: '0.5rem'}}>Módulo de distribución, aplica descuentos por volumen individualmente a cada producto.</p>
          <input 
            type="text" 
            placeholder="🔍 Escanea Referencia (Enter) o busca por nombre..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            onKeyDown={handleSearchKeyPress}
            className="pos-search" 
            style={scanError ? { border: '3px solid #ef4444', backgroundColor: '#fef2f2', transition: 'all 0.2s' } : { transition: 'all 0.2s' }}
            autoFocus
          />
        </div>

        {loading ? (
          <p className="text-muted" style={{padding: '2rem'}}>Cargando catálogo mayorista en vivo...</p>
        ) : (
          <div className="pos-grid">
            {filteredProducts.map(p => (
              <div 
                className={`card pos-card ${p.cantidad <= 0 ? 'out-of-stock' : ''}`} 
                key={p.id} 
                onClick={() => agregarAlCarrito(p)}
                style={{borderColor: '#38bdf8'}}
              >
                <div>
                  <span className="product-name">{p.nombre}</span>
                  {p.referencia && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.referencia}</span>}
                </div>
                <div style={{ marginTop: '0.8rem' }}>
                  <div className="product-price">{formatCOP(p.precio_venta)}</div>
                  <span className={`badge ${p.cantidad <= 0 ? 'agotado' : ''}`}>
                    Stock Venta: {p.cantidad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN DERECHA: CARRITO / TICKET DE CAJA */}
      <div className="pos-cart-panel printable-receipt" style={{borderLeft: '4px solid #38bdf8'}}>
        
        {/* Encabezado del Ticket */}
        <div className="receipt-header print-only" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{empresa.nombre_empresa || "MERCADO PRO"}</h2>
          <h4 style={{ margin: '0.2rem 0' }}>COMPRA MAYORISTA EXCLUSIVA</h4>
          {empresa.nit && <p style={{ fontSize: '0.9rem', margin: '0' }}>NIT: {empresa.nit}</p>}
          <p style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold' }}>No responsable de IVA</p>
          {empresa.direccion && <p style={{ fontSize: '0.85rem', margin: '0' }}>Dir: {empresa.direccion}</p>}
          <p style={{ fontSize: '0.85rem', margin: '0' }}>
             {empresa.telefono && <span>Cel: {empresa.telefono}</span>}
             {empresa.telefono && empresa.correo && <span> | </span>}
             {empresa.correo && <span>Correo: {empresa.correo}</span>}
          </p>
          <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>Ticket No. {facturaIdImpresion || Math.floor(Math.random() * 900000) + 100000}</p>
          <p style={{ margin: '0.5rem 0' }}>------------------------------------</p>
        </div>

        <h3 className="no-print" style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📦 Lote Mayorista</span>
        </h3>

        {/* PESTAÑAS (TABS) */}
        <div className="pos-tabs no-print" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {tabs.map((tab, idx) => (
            <div 
              key={tab.id} 
              onClick={() => setActiveTabId(tab.id)}
              style={{
                padding: '0.35rem 0.6rem', 
                backgroundColor: activeTabId === tab.id ? '#0ea5e9' : '#f1f5f9', 
                color: activeTabId === tab.id ? 'white' : '#475569',
                borderRadius: '6px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                border: activeTabId === tab.id ? 'none' : '1px solid #cbd5e1',
                boxShadow: activeTabId === tab.id ? '0 2px 4px -1px rgba(14, 165, 233, 0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Lote #{idx + 1}
              {tabs.length > 1 && (
                <span 
                  onClick={(e) => { e.stopPropagation(); cerrarTab(tab.id); }}
                  title="Descartar lote"
                  style={{ marginLeft: '0.4rem', cursor: 'pointer', color: activeTabId === tab.id ? '#bae6fd' : '#94a3b8', fontSize: '1rem', lineHeight: '1' }}
                >
                  &times;
                </span>
              )}
            </div>
          ))}
          <button 
            onClick={nuevaTab}
            title="Nuevo mayorista simultáneo"
            style={{
              padding: '0.35rem 0.6rem', 
              backgroundColor: '#10b981', 
              color: 'white',
              borderRadius: '6px', 
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px -1px rgba(16, 185, 129, 0.2)'
            }}
          >
            + Nuevo Lote
          </button>
        </div>
        
        <div className="cart-setup no-print" style={{marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
          <div>
            <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#475569'}}>🏢 Cliente / Distribuidor:</label>
            <input 
              list="lista-clientes-mayoristas"
              type="text" 
              placeholder="🔍 Buscar distribuidor..." 
              value={clienteSearch} 
              onChange={e => {
                const val = e.target.value;
                setClienteSearch(val);
                
                if (val === "Cliente Casual de Contado") {
                  setClienteId("1");
                  return;
                }
                
                const match = clientes.find(c => {
                  const str = `${c.nombre} ${c.documento ? `(${c.documento})` : ''}`;
                  return str === val;
                });
                
                if (match) {
                  setClienteId(match.id.toString());
                } else if (val === "") {
                  setClienteId("1");
                } else {
                  setClienteId("");
                }
              }} 
              style={{width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.15rem', fontSize: '0.85rem'}}
            />
            <datalist id="lista-clientes-mayoristas">
              <option value="Cliente Casual de Contado" />
              {clientes.filter(c => c.id !== 1).map(c => (
                <option key={c.id} value={`${c.nombre} ${c.documento ? `(${c.documento})` : ''}`} />
              ))}
            </datalist>

            {/* Indicador visual del cliente seleccionado */}
            {clienteId && clienteId !== "1" && clienteId !== "" && (
              <div style={{marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '4px', fontSize: '0.85rem', color: '#0369a1'}}>
                ✅ Seleccionado: <strong>{clienteSeleccionado.nombre}</strong>
              </div>
            )}
            
            {/* Si no se encuentra lo escrito */}
            {clienteId === "" && clienteSearch !== "" && (
              <div style={{marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '0.85rem', color: '#92400e'}}>
                ⚠️ Mayorista no encontrado. Regístralo o bórralo para cobro Casual.
              </div>
            )}
          </div>
          <div>
            <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#475569'}}>🧑‍💼 Cajero en Turno:</label>
            <select value={cajeroId} onChange={e => setCajeroId(e.target.value)} style={{width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.15rem', fontSize: '0.85rem'}}>
              <option value="">-- Seleccionar Cajero --</option>
              {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="cart-items-container" style={{ padding: '0.5rem 1rem' }}>
          {carrito.length === 0 ? (
            <p className="empty-state no-print">No has escaneado artículos para la venta masiva.</p>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="cart-item" style={item.qty > item.cantidad ? { backgroundColor: '#fee2e2', borderColor: '#ef4444' } : {}}>
                <div className="cart-item-details">
                  <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: '#0f172a' }}>
                    {item.nombre}
                    {item.qty > item.cantidad && <span style={{ color: '#dc2626', fontSize: '0.7rem', marginLeft: '6px', fontWeight: 'bold' }}>⚠️</span>}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                    {item.referencia ? <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.1rem 0.25rem', borderRadius: '4px', fontSize: '0.65rem', lineHeight: '1' }}>REF: {item.referencia}</span> : null}
                    <span>{formatCOP(item.precio_venta)} c/u base</span>
                  </span>
                </div>
                
                <div className="cart-item-controls no-print">
                  <button onClick={() => removerDelCarrito(item)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => agregarAlCarrito(item)}>+</button>
                </div>

                <div className="no-print" style={{marginLeft: '0.5rem'}}>
                  <input 
                    type="number" 
                    min="0" max="100" 
                    value={item.descuento || 0} 
                    onChange={e => handleDescuentoChange(item.id, e.target.value)} 
                    style={{width: '45px', padding: '0.15rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem'}}
                    title="% Descuento"
                  />
                  <span style={{fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal', marginLeft: '2px'}}>% OFF</span>
                </div>
                
                <span className="print-only">x{item.qty} (-{item.descuento || 0}%)</span>

                <div className="cart-item-total" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>{formatCOP((item.precio_venta * (1 - (item.descuento || 0)/100)) * item.qty)}</span>
                    <button 
                      className="no-print" 
                      onClick={() => eliminarDelCarrito(item)} 
                      title="Quitar todo"
                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✖
                    </button>
                  </div>
                  {item.descuento > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 'normal', marginTop: '0.15rem' }}>
                      Ahorras: {formatCOP(item.precio_venta * (item.descuento / 100) * item.qty)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <div className="cart-summary">
            <div className="summary-row" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
              <span>Subtotal Inicial:</span>
              <span>{formatCOP(subtotalOriginal)}</span>
            </div>
            {valorDescuento > 0 && (
              <div className="summary-row" style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold' }}>
                <span>AHORRO (-):</span>
                <span>-{formatCOP(valorDescuento)}</span>
              </div>
            )}
            <div className="summary-row" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.5rem', color: '#0f172a' }}>
              <span>TOTAL:</span>
              <span>{formatCOP(granTotal)}</span>
            </div>
            
            <div className="print-only" style={{ marginTop: '1.5rem', fontSize: '12px', textAlign: 'left' }}>
              <p style={{ margin: '4px 0' }}><strong>Fecha de compra:</strong> {new Date().toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>Forma de pago:</strong> {metodoPago}</p>
              <p style={{ margin: '4px 0' }}><strong>ID del cliente:</strong> {clienteSeleccionado.documento || clienteSeleccionado.id || 'N/A'}</p>
              <p style={{ margin: '4px 0' }}><strong>Distribuidor:</strong> {clienteSeleccionado.nombre}</p>
              {clienteSeleccionado.direccion && <p style={{ margin: '4px 0' }}><strong>Dirección:</strong> {clienteSeleccionado.direccion}</p>}
              <p style={{ margin: '4px 0' }}><strong>Cajero Vendedor:</strong> {cajeroSeleccionado.nombre}</p>
              
              <div style={{ margin: '15px 0 5px 0', borderTop: '1px dashed #ccc', paddingTop: '10px', whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: '11px' }}>
                {empresa.resolucion || "Resolución DIAN Autorizada"}
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>¡Gracias por confiar en nuestros precios mayoristas!</p>
            </div>

            <div className="cart-actions no-print" style={{ display: 'flex', width: '100%', boxSizing: 'border-box', gap: '0.5rem', marginTop: '0.75rem', overflow: 'hidden' }}>
              <button className="btn-secondary" style={{ flex: 1, minWidth: 0, backgroundColor: '#f8fafc', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.45rem', fontSize: '0.9rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }} onClick={vaciarCarrito}>🗑 Vaciar</button>
              <button className="btn-primary" style={{ flex: 2, minWidth: 0, padding: '0.45rem', fontSize: '0.95rem', backgroundColor: '#4f46e5', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }} onClick={() => setShowCheckout(true)}>💰 Emitir Cobro</button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CHECKOUT */}
      {showCheckout && !ventaExitosa && (
        <div className="modal-overlay no-print">
          <div className="modal-content fade-in">
            <h2>Liquidar Venta Mayorista</h2>
            
            <div className="checkout-total" style={{backgroundColor: '#e0f2fe', color: '#0369a1'}}>
              Gran Total: {formatCOP(granTotal)}
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Método de Pago</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={metodoPago === "Efectivo" ? "btn-primary active" : "btn-secondary"} 
                  onClick={() => setMetodoPago("Efectivo")} 
                  style={{ flex: 1, padding: '0.75rem', border: metodoPago !== "Efectivo" ? '1px solid #ddd' : 'none', backgroundColor: metodoPago === 'Efectivo' ? '#0ea5e9' : '' }}>
                  💵 Efectivo
                </button>
                <button 
                  className={metodoPago === "Transferencia" ? "btn-primary active" : "btn-secondary"} 
                  onClick={() => setMetodoPago("Transferencia")} 
                  style={{ flex: 1, padding: '0.75rem', border: metodoPago !== "Transferencia" ? '1px solid #ddd' : 'none', backgroundColor: metodoPago === 'Transferencia' ? '#0ea5e9' : '' }}>
                  🏦 Transferencia/Cheque
                </button>
              </div>
            </div>

            {metodoPago === "Efectivo" && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Efectivo Recibido en Caja ($)</label>
                <input 
                  type="number" 
                  autoFocus
                  style={{ fontSize: '1.1rem', padding: '0.8rem' }}
                  value={pagoCliente} 
                  onChange={(e) => setPagoCliente(e.target.value)} 
                  placeholder="Ej. Cuánto entrega físico..." 
                />
                
                {cashPaga > 0 && (
                  <div className={`vuelto-display ${vuelto >= 0 ? "success-text" : "danger-text"}`} style={{ marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {vuelto >= 0 ? `Entregar Cambio / Vuelto: ${formatCOP(vuelto)}` : `El cliente aún debe: ${formatCOP(Math.abs(vuelto))}`}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCheckout(false)}>Volver a Calculadora</button>
              <button 
                className="btn-primary" 
                style={{ flex: 2, backgroundColor: '#0ea5e9' }} 
                onClick={confirmarVenta}
                disabled={isProcessing || (metodoPago === "Efectivo" && cashPaga < granTotal)}
              >
                {isProcessing ? "Descontando Stock..." : "✅ Registrar en Sistema"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA ÉXITO / TICKET */}
      {ventaExitosa && (
        <div className="modal-overlay no-print">
          <div className="modal-content fade-in text-center">
            <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>🎉</h1>
            <h2>Lote Mayorista Procesado</h2>
            <p>Doscontados del inventario.</p>
            {metodoPago === "Efectivo" && vuelto > 0 && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', margin: '1.5rem 0' }}>
                <span style={{ display: 'block', color: 'var(--success)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Devolver Cambio Exacto</span>
                <strong style={{ fontSize: '2rem', color: 'var(--success)' }}>{formatCOP(vuelto)}</strong>
              </div>
            )}

            <button className="btn-primary full-width" onClick={imprimirYTerminar} style={{ padding: '1rem', fontSize: '1.1rem', backgroundColor: '#0f172a', marginBottom: '1rem' }}>
              🖨️ Imprimir Factura a Cliente
            </button>
            <button className="btn-secondary full-width" style={{ marginTop: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '1rem', fontSize: '1.1rem' }} onClick={() => { 
                setVentaExitosa(false); 
                setShowCheckout(false); 
                setPagoCliente(""); 
                setFacturaIdImpresion(null);
                if (tabs.length > 1) {
                  const newTabs = tabs.filter(t => t.id !== activeTabId);
                  setTabs(newTabs);
                  setActiveTabId(newTabs[0].id);
                } else {
                  setCarrito([]);
                  setClienteId("1");
                  setClienteSearch("");
                }
              }}>
              ✅ Finalizar e iniciar nuevo lote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VentasMayoristas;
