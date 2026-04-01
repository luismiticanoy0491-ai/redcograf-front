import React, { useEffect, useState } from "react";
import API from "../api/api";
import { formatCOP } from "../utils/format";

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

    setIsProcessing(true);
    try {
      const discountedCart = carrito.map((item: any) => ({
        ...item,
        precio_venta: item.precio_venta * (1 - (item.descuento || 0) / 100)
      }));

      const response = await API.post("/ventas", {
        items: discountedCart,
        metodoPago,
        efectivoEntregado: cashPaga,
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

  const imprimirYTerminar = () => {
    window.print();
  };

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clienteId)) || { nombre: "Distribuidor Casual" };
  const cajeroSeleccionado = cajeros.find(c => c.id === parseInt(cajeroId)) || { nombre: "Cajero Principal" };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 overflow-hidden animate-in fade-in duration-500">
      
      {/* LEFT: Wholesale Catalog */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl overflow-hidden no-print">
        <div className="p-10 border-b border-slate-800 space-y-6 bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-sky-400">🚛</span> Distribución Mayorista
                </h2>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Fulfillment & Bulk Sales</p>
            </div>
            <div className="px-6 py-2 bg-sky-500/10 text-sky-400 text-[10px] font-black rounded-full border border-sky-500/20 uppercase tracking-widest animate-pulse">
                Modo Mayorista Activo
            </div>
          </div>
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors text-xl">🔍</span>
            <input 
              type="text" 
              placeholder="Escanea SKU o localiza ítems para despacho..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              onKeyDown={handleSearchKeyPress}
              className={`w-full pl-16 pr-8 py-5 bg-slate-800/40 border rounded-[32px] outline-none transition-all duration-300 font-bold text-white placeholder:text-slate-600 ${
                scanError ? 'border-red-500 ring-4 ring-red-500/20 bg-red-500/10' : 'border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:bg-slate-800'
              }`}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-none bg-slate-950/20">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-sky-500 rounded-full animate-spin"></div>
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Sincronizando Almacén Central...</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  disabled={p.cantidad <= 0}
                  className="group relative flex flex-col p-6 bg-slate-800/20 rounded-[40px] border border-slate-800 text-left transition-all duration-500 hover:bg-slate-800 hover:border-sky-500/50 hover:-translate-y-2 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:translate-y-0"
                >
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-100 line-clamp-2 leading-tight min-h-[2.5rem] tracking-tight group-hover:text-sky-300 transition-colors">{p.nombre}</h3>
                    {p.referencia && <p className="text-[10px] font-black text-sky-500 uppercase mt-1 tracking-widest opacity-60">{p.referencia}</p>}
                  </div>
                  <div className="mt-auto space-y-3">
                    <div className="text-xl font-black text-white">{formatCOP(p.precio_venta)}</div>
                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">En Rack</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                             p.cantidad <= 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                        }`}>{p.cantidad}</span>
                    </div>
                  </div>
                  <div className="absolute right-4 top-4 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-sky-500/40 font-black">+</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Wholesale Cart */}
      <div className="w-full lg:w-[480px] bg-white rounded-[48px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden printable-receipt">
        
        {/* Receipt Header (Print Only) */}
        <div className="hidden print:block text-center p-10 space-y-2">
            <h2 className="text-2xl font-black">{empresa.nombre_empresa || "MI EMPRESA"}</h2>
            <p className="text-sm font-black uppercase tracking-widest text-slate-500 mt-2">Facturación Mayorista</p>
            {empresa.nit && <p className="text-xs font-bold mt-4">NIT: {empresa.nit}</p>}
            <div className="py-4 border-y border-dashed border-slate-300 my-6 uppercase font-black text-sm tracking-widest">
                Lote Mayorista No. {facturaIdImpresion || '000000'}
            </div>
        </div>

        {/* Tab & Customer Section */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 no-print space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-2">
                    <span className="w-2 h-6 bg-slate-950 rounded-full"></span> Lote de Distribución
                </h3>
                <button onClick={nuevaTab} className="bg-slate-950 text-white w-10 h-10 rounded-2xl hover:bg-slate-800 transition-all font-black text-xl shadow-xl shadow-slate-200">+</button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {tabs.map((tab: any, idx: number) => (
                    <div 
                        key={tab.id} 
                        onClick={() => setActiveTabId(tab.id)}
                        className={`relative px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap cursor-pointer transition-all border flex items-center gap-2 ${
                        activeTabId === tab.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                        #0{(idx + 1)}
                        {tabs.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); cerrarTab(tab.id); }} className="ml-2 opacity-30 hover:opacity-100">&times;</button>
                        )}
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Distribuidor / Cliente Especial</label>
                    <input 
                        list="lista-clientes-m"
                        type="text" 
                        placeholder="Vincular Comerciante..." 
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
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-100 outline-none"
                    />
                    <datalist id="lista-clientes-m">
                        <option value="Distribuidor Casual" />
                        {clientes.filter(c => c.id !== 1).map(c => (
                            <option key={c.id} value={`${c.nombre} ${c.documento ? `(${c.documento})` : ''}`} />
                        ))}
                    </datalist>
                </div>
                <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Persona a cargo del Despacho</label>
                    <select value={cajeroId} onChange={e => setCajeroId(e.target.value)} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-100 outline-none appearance-none">
                        <option value="">-- Autenticar Responsable --</option>
                        {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-white scrollbar-none">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-20">
              <div className="text-7xl mb-6">📦</div>
              <p className="font-black uppercase tracking-widest text-[10px]">Sin ítems en despacho</p>
            </div>
          ) : (
            carrito.map((item: any) => (
              <div key={item.id} className={`group flex flex-col p-6 rounded-[32px] border transition-all duration-300 ${
                item.qty > item.cantidad ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight">{item.nombre}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-slate-400 font-black text-[10px]">{formatCOP(item.precio_venta)} unit.</span>
                       <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">BULK</span>
                    </div>
                  </div>
                  <button onClick={() => eliminarDelCarrito(item)} className="no-print opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all font-black">&times;</button>
                </div>
                
                <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-slate-200/60 gap-4">
                  <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm no-print border border-slate-100">
                    <button onClick={() => removerDelCarrito(item)} className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-900 font-black">-</button>
                    <span className="w-10 text-center font-black text-sm">{item.qty}</span>
                    <button onClick={() => agregarAlCarrito(item)} className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-900 font-black">+</button>
                  </div>
                  
                  <div className="flex items-center gap-3 no-print">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dcto (%)</span>
                        <input 
                            type="number" 
                            className="w-16 px-3 py-2 bg-white border border-slate-200 rounded-2xl text-center text-xs font-black text-indigo-600 outline-none focus:ring-8 focus:ring-indigo-50"
                            value={item.descuento || 0} 
                            onChange={e => handleDescuentoChange(item.id, e.target.value)} 
                        />
                    </div>
                  </div>

                  <div className="text-right ml-auto">
                    <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest mb-1">Subtotal Lote</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter">
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
          <div className="p-10 bg-slate-950 text-white rounded-t-[56px] shadow-2xl relative overflow-hidden shrink-0">
            <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>Avalúo Comercial</span>
                    <span className="line-through">{formatCOP(subtotalOriginal)}</span>
                </div>
                <div className="flex justify-between items-center text-sky-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>Incentivos Aplicados</span>
                    <span className="font-black">-{formatCOP(valorDescuento)}</span>
                </div>
                <div className="pt-6 border-t border-slate-900 flex justify-between items-end">
                    <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">Total Compra Mayorista</span>
                        <div className="text-5xl font-black tracking-tighter text-white">{formatCOP(granTotal)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10 no-print">
                    <button onClick={vaciarCarrito} className="py-5 bg-slate-900 text-slate-500 font-black rounded-3xl hover:text-white transition-all border border-slate-800 uppercase tracking-widest text-[10px]">Vaciar</button>
                    <button onClick={() => setShowCheckout(true)} className="py-5 bg-sky-500 text-white font-black rounded-3xl shadow-2xl shadow-sky-500/20 hover:bg-sky-600 hover:-translate-y-1 transition-all uppercase tracking-widest text-[10px]">Finalizar Compra</button>
                </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default VentasMayoristas;
