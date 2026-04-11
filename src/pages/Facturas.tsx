import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import API from "../api/api";
import { formatCOP, formatDateTime } from "../utils/format";
import { FacturaVenta } from "../types";
import PrintReceipt from "../components/PrintReceipt";

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
  const [phoneWS, setPhoneWS] = useState("");

  // Estado para Imprimir
  const [facturaPrintData, setFacturaPrintData] = useState<{cabecera: FacturaVenta, detalles: any[]} | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  useEffect(() => {
    if (facturaPrintData) {
      setTimeout(() => {
        reactToPrintFn();
      }, 100);
    }
  }, [facturaPrintData, reactToPrintFn]);

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
    if (!window.confirm(`⚠️ ¿Anular factura #${id}? Se devolverá el stock.`)) return;
    API.delete(`/ventas/${id}`)
      .then(res => {
        if (res.data.success) {
          fetchFacturas();
        }
      })
      .catch(err => {
          console.error(err);
          alert("Error al anular.");
      });
  };

  const verDetalles = (id: number) => {
    API.get(`/ventas/${id}`)
      .then(res => {
        setDetallesFactura(res.data);
        setModalDetalle(id);
        setMenuOpenId(null);
        
        // Cargar teléfono del cliente
        const f = facturas.find(fac => fac.id === id);
        setPhoneWS(f?.telefono?.replace(/\D/g, '') || "");
      })
      .catch(console.error);
  };

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
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700 pb-20" onClick={() => setMenuOpenId(null)}>
      
      <div className="no-print space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200">
            <div className="space-y-1">
                <h1 className="text-4xl font-medium tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    Historial de Ventas
                </h1>
                <p className="text-slate-500 font-medium text-lg italic">Control total de comprobantes y auditoría de transacciones.</p>
            </div>
            <div className="w-full md:w-auto relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">🔍</span>
                <input 
                    type="text" 
                    placeholder="Buscar por ID o cliente..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-bold text-slate-700"
                />
            </div>
        </div>

        {/* Filters & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                {["Todas", "Efectivo", "Transferencia"].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFiltroRapido(f)}
                        className={`px-6 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
                            filtroRapido === f ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {f === "Todas" ? "Todas" : f === "Efectivo" ? "Efectivo" : "Banco"}
                    </button>
                ))}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-full">
                {facturasFiltradas.length} Facturas Registradas
            </div>
        </div>

        {/* Invoice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
                <div className="col-span-full py-20 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando base de datos...</p>
                </div>
            ) : facturasFiltradas.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <div className="text-6xl mb-4">📂</div>
                    <p className="text-slate-400 font-bold italic">No se encontraron comprobantes para esta búsqueda.</p>
                </div>
            ) : (
                facturasFiltradas.map((f: FacturaVenta) => {
                    
                    return (
                        <div key={f.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative">
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-medium text-slate-900 tracking-tight leading-tight uppercase group-hover:text-indigo-600 transition-colors">{f.cliente || "Consumidor Final"}</h3>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Fca #{(f.id).toString().padStart(6, '0')}</span>
                                </div>
                                <div className="relative">
                                    <button 
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === f.id ? null : f.id); }}
                                    >
                                        <span className="text-xl font-bold leading-none">⋮</span>
                                    </button>
                                    {menuOpenId === f.id && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-20 animate-in zoom-in duration-200">
                                            <button onClick={() => verDetalles(f.id)} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-50 text-xs font-black text-slate-700 flex items-center gap-3">
                                                <span>🔍</span> Ver Auditoría
                                            </button>
                                            <button onClick={() => handleImprimirVenta(f)} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-50 text-xs font-black text-indigo-600 flex items-center gap-3">
                                                <span>🖨️</span> Re-imprimir Ticket
                                            </button>
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button onClick={() => procesarBorrado(f.id)} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-red-50 text-xs font-black text-red-500 flex items-center gap-3">
                                                <span>🗑️</span> Anular Venta
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Fecha de Emisión</span>
                                    <span className="text-xs font-medium text-slate-600">{formatDateTime(f.fecha)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-tighter ${
                                            f.metodo_pago === 'Efectivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                                        }`}>
                                            {f.metodo_pago}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mb-1">Monto Total</span>
                                        <span className="text-2xl font-medium text-slate-900 tracking-tighter">{formatCOP(f.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-x-8 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Floating Button */}
        <button 
            onClick={() => window.location.href="/"}
            className="fixed bottom-10 right-10 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all z-30"
        >+</button>
      </div>

      {/* MODAL: Detalles */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setModalDetalle(null)}></div>
          <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-400">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Auditoría Factura #{modalDetalle}</h2>
                <button onClick={() => setModalDetalle(null)} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-10">
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                    {detallesFactura.map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="min-w-0">
                                <h4 className="text-sm font-medium text-slate-800 truncate uppercase">{d.nombre}</h4>
                                <p className="text-[10px] font-medium text-slate-400 mt-1">{d.cantidad} Unds x {formatCOP(d.precio_unitario)}</p>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                                <span className="text-sm font-medium text-indigo-600">{formatCOP(d.cantidad * d.precio_unitario)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block text-center">WhatsApp del Cliente</label>
                        <div className="flex gap-2">
                           <span className="flex items-center justify-center bg-slate-100 px-4 rounded-2xl text-slate-500 font-bold text-xs">+57</span>
                           <input 
                             type="text" 
                             placeholder="Número de celular..." 
                             value={phoneWS}
                             onChange={(e) => setPhoneWS(e.target.value)}
                             className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none font-bold text-slate-700 text-lg text-center"
                           />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            className="flex-1 py-5 bg-slate-900 text-white font-medium rounded-3xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                            onClick={() => {
                              const f = facturas.find(fac => fac.id === modalDetalle);
                              if (f) setFacturaPrintData({ cabecera: f, detalles: detallesFactura });
                            }}
                        >
                            🖨️ Re-Imprimir
                        </button>
                        <button 
                            className="flex-1 py-5 bg-emerald-600 text-white font-medium rounded-3xl shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                            onClick={() => {
                              const f = facturas.find(fac => fac.id === modalDetalle);
                              if (!f) return;
                              
                              let targetPhone = phoneWS.replace(/\D/g, '');
                              
                              const launchWS = (num: string) => {
                                const itemsText = detallesFactura.map(d => `• ${d.nombre} (x${d.cantidad})`).join('\n');
                                const message = `¡Hola! 👋\n📄 *Factura Digital ${empresa.nombre_empresa || 'de nuestra tienda'}*\n\n*Comprobante # ${f.id}*\n💰 *Total:* ${formatCOP(f.total)}\n\n🛒 *Resumen:*\n${itemsText}\n\n¡Gracias por su compra! ✨`;
                                const fullNum = num.startsWith('57') ? num : `57${num}`;
                                window.open(`https://api.whatsapp.com/send?phone=${fullNum}&text=${encodeURIComponent(message)}`, '_blank');
                              };

                              if (!targetPhone || targetPhone === '0') {
                                 const manualPhone = window.prompt("📱 Ingresa el número de WhatsApp (ej: 300...):");
                                 if (manualPhone) {
                                     targetPhone = manualPhone.replace(/\D/g, '');
                                     setPhoneWS(targetPhone);
                                     launchWS(targetPhone);
                                 }
                              } else {
                                 launchWS(targetPhone);
                              }
                            }}
                        >
                            📱 Compartir
                        </button>
                    </div>
                    <button onClick={() => setModalDetalle(null)} className="w-full py-5 bg-slate-100 text-slate-500 font-medium rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Cerrar Auditoría</button>
                </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        {facturaPrintData && (
          <PrintReceipt
            ref={contentRef}
            empresa={empresa}
            numero={facturaPrintData.cabecera.id}
            fecha={facturaPrintData.cabecera.fecha}
            cliente={facturaPrintData.cabecera.cliente || "Consumidor Final"}
            cajero={facturaPrintData.cabecera.cajero || "Principal"}
            metodoPago={facturaPrintData.cabecera.metodo_pago}
            items={facturaPrintData.detalles}
            total={facturaPrintData.cabecera.total}
            pagoEfectivoMixto={facturaPrintData.cabecera.metodo_pago === 'Mixto' ? facturaPrintData.cabecera.pago_efectivo : undefined}
            pagoTransferenciaMixto={facturaPrintData.cabecera.metodo_pago === 'Mixto' ? facturaPrintData.cabecera.pago_transferencia : undefined}
          />
        )}
      </div>

    </div>
  );
}

export default Facturas;
