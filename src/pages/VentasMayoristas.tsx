import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import PrintReceipt from "../components/PrintReceipt";

function VentasMayoristas() {
  const [productos, setProductos] = useState<any[]>([]);
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
  const activeTab = tabs.find((t: any) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    localStorage.setItem("posMayoristaTabs", JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem("posMayoristaActiveTab", JSON.stringify(activeTabId));
  }, [activeTabId]);

  const carrito = activeTab.carrito;
  const clienteId = activeTab.clienteId;
  const clienteSearch = activeTab.clienteSearch;

  const updateActiveTab = (updates: any) => {
    setTabs((prev: any[]) => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const setCarrito = (newCarrito: any[]) => updateActiveTab({ carrito: newCarrito });
  const setClienteId = (newId: string) => updateActiveTab({ clienteId: newId });
  const setClienteSearch = (newSearch: string) => updateActiveTab({ clienteSearch: newSearch });
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [pagoCliente, setPagoCliente] = useState("");
  
  const [pagoEfectivoMixto, setPagoEfectivoMixto] = useState("");
  const [pagoTransferenciaMixto, setPagoTransferenciaMixto] = useState("");
  const efMixto = parseFloat(pagoEfectivoMixto) || 0;
  const trMixto = parseFloat(pagoTransferenciaMixto) || 0;
  const sumMixto = efMixto + trMixto;
  
  const [cajeros, setCajeros] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
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
    const newId = Math.max(...tabs.map((t: any) => t.id), 0) + 1;
    setTabs([...tabs, { id: newId, carrito: [], clienteId: "1", clienteSearch: "" }]);
    setActiveTabId(newId);
  };

  const cerrarTab = (id: number) => {
    if (tabs.length === 1) return;
    if (window.confirm("¿Descartar este lote mayorista?")) {
      const newTabs = tabs.filter((t: any) => t.id !== id);
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

  const agregarAlCarrito = (producto: any) => {
    const exist = carrito.find((x: any) => x.id === producto.id);
    const newQty = exist ? exist.qty + 1 : 1;

    if (exist) {
      setCarrito(carrito.map((x: any) => x.id === producto.id ? { ...exist, qty: newQty } : x));
    } else {
      setCarrito([...carrito, { ...producto, qty: 1, descuento: 30 }]);
    }
  };

  const removerDelCarrito = (producto: any) => {
    const exist = carrito.find((x: any) => x.id === producto.id);
    if (exist.qty === 1) {
      setCarrito(carrito.filter((x: any) => x.id !== producto.id));
    } else {
      setCarrito(carrito.map((x: any) => x.id === producto.id ? { ...exist, qty: exist.qty - 1 } : x));
    }
  };

  const eliminarDelCarrito = (producto: any) => {
    setCarrito(carrito.filter((x: any) => x.id !== producto.id));
  };

  const vaciarCarrito = () => {
    if (window.confirm("¿Vaciar despacho actual?")) setCarrito([]);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      e.preventDefault();
      const matchedProduct = productos.find(p => 
        p.referencia && p.referencia.trim().toLowerCase() === search.trim().toLowerCase()
      );
      
      if (matchedProduct) {
        agregarAlCarrito(matchedProduct);
        setSearch("");
      } else {
        setScanError(true);
        setTimeout(() => setScanError(false), 800);
      }
    }
  };

  const handleDescuentoChange = (id: number, valor: string) => {
    let desc = parseFloat(valor) || 0;
    if (desc < 0) desc = 0;
    if (desc > 100) desc = 100;
    setCarrito(carrito.map((x: any) => x.id === id ? { ...x, descuento: desc } : x));
  };

  const subtotalOriginal = carrito.reduce((a: number, c: any) => a + c.precio_venta * c.qty, 0);
  const granTotal = carrito.reduce((a: number, c: any) => a + (c.precio_venta * (1 - (c.descuento || 0) / 100)) * c.qty, 0);
  const valorDescuento = subtotalOriginal - granTotal;

  const cashPaga = parseFloat(pagoCliente) || 0;
  const vuelto = cashPaga - granTotal;

  const confirmarVenta = async () => {
    if (carrito.length === 0) return;
    if (!cajeroId) return alert("Selecciona cajero de despacho.");
    if (metodoPago === "Efectivo" && cashPaga < granTotal) {
      return alert("Efectivo insuficiente.");
    }
    if (metodoPago === "Mixto" && sumMixto !== granTotal) {
      return alert("La suma de valores en pago mixto debe ser EXACTAMENTE el total de la factura.");
    }

    setIsProcessing(true);
    try {
      const discountedCart = carrito.map((item: any) => ({
        ...item,
        precio_venta: item.precio_venta * (1 - (item.descuento || 0) / 100)
      }));

      const response = await API.post("/ventas", {
        items: discountedCart,
        metodoPago,
        efectivoEntregado: metodoPago === "Mixto" ? efMixto : cashPaga,
        transferenciaEntregada: metodoPago === "Mixto" ? trMixto : (metodoPago === "Tarjeta" ? granTotal : 0),
        vuelto: vuelto > 0 ? vuelto : 0,
        cajeroId: parseInt(cajeroId),
        clienteId: clienteId ? parseInt(clienteId) : 1,
        total: granTotal
      });
      setFacturaIdImpresion(response.data.factura_id);
      setVentaExitosa(true);
      fetchInventory(); 
    } catch (err) {
      console.error(err);
      alert("Error procesando despacho.");
    } finally {
      setIsProcessing(false);
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const imprimirYTerminar = () => {
    reactToPrintFn();
  };

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clienteId)) || { nombre: "Distribuidor Casual" };
  const cajeroSeleccionado = cajeros.find(c => c.id === parseInt(cajeroId)) || { nombre: "Cajero Principal" };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 overflow-hidden animate-in fade-in duration-500">
      
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-sky-600">🚛</span> Distribución Mayorista
            </h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-100 flex items-center gap-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-pulse"></span>
                Modo Mayorista Activo
              </span>
            </div>
          </div>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors">🔍</span>
            <input 
              type="text" 
              placeholder="Escanea SKU o localiza ítems para despacho..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              onKeyDown={handleSearchKeyPress}
              className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl outline-none transition-all duration-300 font-medium ${
                scanError ? 'border-red-500 ring-4 ring-red-50 bg-red-50' : 'border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-50 focus:bg-white '
              }`}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Almacén...</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  disabled={p.cantidad <= 0}
                  className={`group relative flex flex-col p-4 bg-white rounded-2xl border border-slate-200 text-left transition-all duration-300 hover:shadow-xl hover:shadow-sky-100 hover:border-sky-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:translate-y-0 disabled:shadow-none ${
                    p.cantidad <= 0 ? 'bg-slate-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem]">{p.nombre}</h3>
                    {p.referencia && <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-wider">{p.referencia}</p>}
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="text-lg font-black text-sky-600">{formatCOP(p.precio_venta)}</div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                      p.cantidad <= 0 ? 'bg-red-100 text-red-600' : 
                      p.cantidad < 5 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      En Rack: {p.cantidad}
                    </div>
                  </div>
                  <div className="absolute right-3 bottom-12 text-2xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">📦</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart / Checkout */}
      <div className="w-full lg:w-[450px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden printable-receipt">
        
        {/* Receipt Header (Print Only) */}
        <div className="hidden text-center p-6 space-y-2">
            <h2 className="text-xl font-black">{empresa.nombre_empresa || "MI EMPRESA"}</h2>
            <p className="text-sm font-black uppercase tracking-widest text-slate-500 mt-2">Facturación Mayorista</p>
            {empresa.nit && <p className="text-xs font-bold mt-4">NIT: {empresa.nit}</p>}
            <div className="py-4 border-y border-dashed border-slate-300 my-6 uppercase font-black text-sm tracking-widest">
                Lote Mayorista No. {facturaIdImpresion || '000000'}
            </div>
        </div>

        {/* Tab System (no-print) */}
        <div className="p-3 no-print border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-slate-900 tracking-tight text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-600 rounded-full"></span> Lote de Distribución
            </h3>
            <button onClick={nuevaTab} className="px-2 py-1 bg-sky-50 text-sky-600 text-xs rounded-lg hover:bg-sky-100 transition-colors font-bold" title="Nueva Cuenta">
              + Nuevo Lote
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab: any, idx: number) => (
              <div 
                key={tab.id} 
                onClick={() => setActiveTabId(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-2 ${
                  activeTabId === tab.id 
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-100" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Lote {idx + 1}
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); cerrarTab(tab.id); }}
                    className={`hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center leading-none ${activeTabId === tab.id ? 'text-sky-200' : 'text-slate-400'}`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Cashier Setup (no-print) */}
        <div className="p-3 bg-slate-50/50 no-print space-y-2 border-b border-slate-100">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Distribuidor / Cliente</label>
              <div className="relative">
                <input 
                    list="lista-clientes-m"
                    type="text" 
                    placeholder="Vincular..." 
                    value={clienteSearch} 
                    onChange={e => {
                        const val = e.target.value;
                        setClienteSearch(val);
                        if (val === "Distribuidor Casual") { setClienteId("1"); return; }
                        const match = clientes.find(c => `${c.nombre} ${c.documento ? `(${c.documento})` : ''}` === val);
                        if (match) setClienteId(match.id.toString());
                        else if (val === "") setClienteId("1");
                        else setClienteId("");
                    }} 
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-100 outline-none"
                />
                <datalist id="lista-clientes-m">
                    <option value="Distribuidor Casual" />
                    {clientes.filter(c => c.id !== 1).map(c => (
                        <option key={c.id} value={`${c.nombre} ${c.documento ? `(${c.documento})` : ''}`} />
                    ))}
                </datalist>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Responsable</label>
              <select 
                value={cajeroId} 
                onChange={e => setCajeroId(e.target.value)} 
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-100 outline-none appearance-none"
              >
                  <option value="">-- Cajero --</option>
                  {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center no-print">
              <div className="text-4xl mb-3 opacity-20">📦</div>
              <p className="text-slate-400 font-bold text-[11px] tracking-tight">Sin ítems en mayoreo.</p>
            </div>
          ) : (
            carrito.map((item: any) => (
              <div key={item.id} className={`group flex flex-col p-3 rounded-2xl border transition-all duration-300 ${
                item.qty > item.cantidad ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 hover:border-sky-100'
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 flex flex-wrap gap-x-2 gap-y-1">
                    <h4 className="text-[11px] w-full font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight truncate">{item.nombre}</h4>
                    <div className="flex items-center flex-wrap gap-1">
                       <span className="text-sky-600 font-black text-[10px]">{formatCOP(item.precio_venta)} un.</span>
                       {item.descuento > 0 && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-emerald-200 flex items-center">
                            Ahorras: {formatCOP(item.precio_venta * (item.descuento/100) * item.qty)}
                          </span>
                       )}
                    </div>
                  </div>
                  <button 
                    onClick={() => eliminarDelCarrito(item)} 
                    className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all font-black text-sm p-1"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-50 gap-2">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 no-print">
                    <button onClick={() => removerDelCarrito(item)} className="w-6 h-6 rounded hover:bg-white text-slate-600 shadow-none hover:shadow-sm transition-all font-black text-xs">-</button>
                    <span className="w-6 text-center font-black text-[11px] text-slate-900">{item.qty}</span>
                    <button onClick={() => agregarAlCarrito(item)} className="w-6 h-6 rounded hover:bg-white text-slate-600 shadow-none hover:shadow-sm transition-all font-black text-xs">+</button>
                  </div>
                  
                  <div className="flex items-center gap-2 no-print">
                    <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Dcto (%)</span>
                        <input 
                            type="number" 
                            className="w-12 px-1.5 py-1 bg-white border border-slate-200 rounded text-center text-[10px] font-black text-sky-600 outline-none focus:ring-1 focus:ring-sky-100"
                            value={item.descuento || 0} 
                            onChange={e => handleDescuentoChange(item.id, e.target.value)} 
                        />
                    </div>
                  </div>

                  <div className="text-right ml-auto">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-widest mb-0.5">Subtotal Lote</span>
                    <span className="text-xs font-black text-slate-900">
                        {formatCOP((item.precio_venta * (1 - (item.descuento || 0)/100)) * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        {carrito.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 space-y-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
             <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                    <span>Avalúo Comercial</span>
                    <span className="line-through">{formatCOP(subtotalOriginal)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                    <span>Incentivos Aplicados</span>
                    <span className="">-{formatCOP(valorDescuento)}</span>
                </div>
             </div>

            <div className="flex justify-between items-center bg-sky-50 p-3 rounded-xl border border-sky-100 mt-2">
               <div>
                  <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Total Mayorista</span>
                  <p className="text-xl font-black text-sky-700 leading-none mt-1">{formatCOP(granTotal)}</p>
               </div>
            </div>

            <div className="flex gap-2 no-print mt-2">
              <button 
                onClick={vaciarCarrito} 
                className="flex-1 py-2 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-100 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs"
              >
                🗑 Vaciar
              </button>
              <button 
                onClick={() => setShowCheckout(true)} 
                className="flex-[2] py-2 bg-sky-600 text-white font-black rounded-xl shadow-md shadow-sky-100 hover:shadow-sky-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                Finalizar Compra
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        {ventaExitosa && (
          <PrintReceipt
            ref={contentRef}
            empresa={empresa}
            numero={facturaIdImpresion || ""}
            fecha={new Date()}
            cliente={clienteSeleccionado.nombre}
            cajero={cajeroSeleccionado.nombre}
            metodoPago={metodoPago}
            items={carrito.map((c: any) => ({
              ...c,
              precio_unitario: c.precio_venta * (1 - (c.descuento || 0) / 100)
            }))}
            total={granTotal}
            subtotal={subtotalOriginal}
            efectivoRecibido={metodoPago === "Mixto" ? efMixto : cashPaga}
            vuelto={vuelto}
            pagoEfectivoMixto={metodoPago === "Mixto" ? efMixto : undefined}
            pagoTransferenciaMixto={metodoPago === "Mixto" ? trMixto : undefined}
          />
        )}
      </div>

      {/* MODAL: Checkout */}
      {showCheckout && !ventaExitosa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowCheckout(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/40 overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="bg-sky-600 p-8 text-center space-y-2">
              <h2 className="text-white text-2xl font-black tracking-tight">Cierre General Mayorista</h2>
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-white font-bold">
                Monto: {formatCOP(granTotal)}
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-3xl">
                  <button 
                    onClick={() => setMetodoPago("Efectivo")} 
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      metodoPago === "Efectivo" ? "bg-white text-sky-600 shadow-xl shadow-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button 
                    onClick={() => setMetodoPago("Tarjeta")} 
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      metodoPago === "Tarjeta" ? "bg-white text-sky-600 shadow-xl shadow-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    💳 Tarjeta / Transfer
                  </button>
                  <button 
                    onClick={() => setMetodoPago("Mixto")} 
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      metodoPago === "Mixto" ? "bg-white text-sky-600 shadow-xl shadow-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🔄 Mixto
                  </button>
                </div>
              </div>

              {metodoPago === "Efectivo" && (
                <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Efectivo Desembolsado</label>
                  <input 
                    type="number" 
                    autoFocus
                    value={pagoCliente} 
                    onChange={(e) => setPagoCliente(e.target.value)} 
                    placeholder="Monto entregado..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-50 focus:border-sky-600 outline-none text-xl font-black transition-all"
                  />
                  
                  {cashPaga > 0 && (
                    <div className={`p-4 rounded-2xl font-bold text-center border animate-in zoom-in duration-300 ${
                      vuelto >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {vuelto >= 0 ? (
                        <>
                          <span className="text-[10px] uppercase block mb-1">Cambio de Caja</span>
                          <span className="text-2xl">{formatCOP(vuelto)}</span>
                        </>
                      ) : (
                        `Monto Insuficiente: ${formatCOP(Math.abs(vuelto))}`
                      )}
                    </div>
                  )}
                </div>
              )}

              {metodoPago === "Mixto" && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Efectivo</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                          <input 
                              type="number" 
                              value={pagoEfectivoMixto} 
                              onChange={(e) => setPagoEfectivoMixto(e.target.value)} 
                              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-50 focus:border-sky-600 outline-none font-black text-slate-700 transition-all"
                          />
                       </div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transferencia</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                          <input 
                              type="number" 
                              value={pagoTransferenciaMixto} 
                              onChange={(e) => setPagoTransferenciaMixto(e.target.value)} 
                              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-50 focus:border-sky-600 outline-none font-black text-slate-700 transition-all"
                          />
                       </div>
                    </div>
                  </div>
                  {sumMixto > 0 && (
                    <div className="mt-2">
                      {(() => {
                        const dif = sumMixto - granTotal;
                        return (
                          <div className={`p-4 rounded-2xl font-bold text-center border animate-in zoom-in duration-300 ${
                            dif === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            <span className="text-[10px] uppercase block mb-1">Monto Mixto Consolidado</span>
                            <span className="text-2xl">{formatCOP(sumMixto)}</span>
                            {dif !== 0 && (
                              <p className="text-xs font-bold opacity-80 mt-1">Diferencia: {formatCOP(dif)} (Debe ser exacto)</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowCheckout(false)} 
                  className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Regresar
                </button>
                <button 
                  onClick={confirmarVenta}
                  disabled={isProcessing || (metodoPago === "Efectivo" && cashPaga < granTotal) || (metodoPago === "Mixto" && sumMixto !== granTotal)}
                  className="flex-[2] py-4 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-100 hover:bg-sky-700 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "Confirmar Venta 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Success */}
      {ventaExitosa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-sky-900/70 backdrop-blur-lg animate-in fade-in duration-300"></div>
          <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-3xl p-10 text-center animate-in zoom-in duration-500 box-content">
            <div className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">
              📦
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">¡Despacho Exitoso!</h2>
            <p className="text-slate-500 font-medium mb-8">El lote mayorista fue registrado y descontado del inventario general.</p>
            
            {metodoPago === "Efectivo" && vuelto > 0 && (
              <div className="bg-emerald-50 rounded-3xl p-6 mb-8 border border-emerald-100">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Devolver Cambio</span>
                <strong className="text-3xl text-emerald-700 font-black">{formatCOP(vuelto)}</strong>
              </div>
            )}

            <div className="space-y-4">
              <button 
                onClick={imprimirYTerminar}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
              >
                <span className="text-xl group-hover:rotate-12 transition-transform">🖨️</span> Imprimir Recibo
              </button>
              <button 
                onClick={() => { 
                  setVentaExitosa(false); 
                  setShowCheckout(false); 
                  setPagoCliente(""); 
                  setPagoEfectivoMixto("");
                  setPagoTransferenciaMixto("");
                  setFacturaIdImpresion(null);
                  if (tabs.length > 1) {
                    const newTabs = tabs.filter((t: any) => t.id !== activeTabId);
                    setTabs(newTabs);
                    setActiveTabId(newTabs[0].id);
                  } else {
                    setCarrito([]);
                    setClienteId("1");
                    setClienteSearch("");
                  }
                }}
                className="w-full py-5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Continuar Despachando
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default VentasMayoristas;
