import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import API from "../api/api";
import { formatCOP } from "../utils/format";
import PrintReceipt from "../components/PrintReceipt";

interface Producto {
  id: number;
  nombre: string;
  referencia: string;
  precio_venta: number;
  cantidad: number;
}

interface Cliente {
  id: number;
  nombre: string;
  documento: string;
}

export default function Separados() {
  const [separados, setSeparados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [termSeparado, setTermSeparado] = useState("");

  // For New Separado
  const [showNewModal, setShowNewModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const [empresa, setEmpresa] = useState<any>({});
  const [facturaPrintData, setFacturaPrintData] = useState<{cabecera: any, detalles: any[]} | null>(null);
  const [separadoPrintData, setSeparadoPrintData] = useState<{separado: any, abonos: any[]} | null>(null);

  const [newClienteId, setNewClienteId] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [initialPayment, setInitialPayment] = useState("");

  // For View/Abonar
  const [viewSeparado, setViewSeparado] = useState<any>(null);
  const [viewAbonos, setViewAbonos] = useState<any[]>([]);
  const [abonoInput, setAbonoInput] = useState("");

  const [cajeros, setCajeros] = useState<any[]>([]);
  const [cajeroId, setCajeroId] = useState("");

  const facturaContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFactura = useReactToPrint({ contentRef: facturaContentRef });

  const separadoContentRef = useRef<HTMLDivElement>(null);
  const reactToPrintSeparado = useReactToPrint({ contentRef: separadoContentRef });

  useEffect(() => {
    fetchSeparados();
    API.get("/clientes").then(res => setClientes(res.data)).catch(console.error);
    API.get("/productos").then(res => setProductos(res.data)).catch(console.error);
    API.get("/cajeros").then(res => setCajeros(res.data)).catch(console.error);
    API.get("/empresa").then(res => setEmpresa(res.data)).catch(console.error);
  }, []);

  const fetchSeparados = () => {
    setLoading(true);
    API.get("/separados")
      .then(res => { setSeparados(res.data); setLoading(false); })
      .catch(console.error);
  };

  const handleCreate = async () => {
    if (!newClienteId) return alert("Selecciona un cliente");
    if (cart.length === 0) return alert("Agrega al menos un producto");
    
    const total = cart.reduce((acc, c) => acc + (c.precio_venta * c.qty), 0);
    const abono = parseFloat(initialPayment) || 0;
    
    if (abono > total) return alert("El abono inicial no puede ser mayor al total");

    try {
      await API.post("/separados", {
        cliente_id: parseInt(newClienteId),
        detalles: cart,
        total,
        abono_inicial: abono
      });
      alert("✅ Separado creado exitosamente");
      setShowNewModal(false);
      setCart([]);
      setNewClienteId("");
      setInitialPayment("");
      fetchSeparados();
    } catch (error) {
      console.error(error);
      alert("Error al crear el separado");
    }
  };

  const addProdToCart = (prod: Producto) => {
    const exist = cart.find(x => x.id === prod.id);
    if (exist) {
      setCart(cart.map(x => x.id === prod.id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...prod, qty: 1 }]);
    }
    setProdSearch("");
  };

  const openView = (id: number) => {
    API.get(`/separados/${id}`)
      .then(res => {
        setViewSeparado(res.data.separado);
        setViewAbonos(res.data.abonos);
        setAbonoInput("");
      })
      .catch(console.error);
  };

  const handleAbonar = async () => {
    const abono = parseFloat(abonoInput);
    if (!abono || abono <= 0) return alert("Ingresa un abono válido");
    if (abono > viewSeparado.saldo_pendiente) return alert("El abono no puede superar el saldo pendiente");

    try {
      await API.post(`/separados/${viewSeparado.id}/abonos`, { monto: abono });
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al abonar");
    }
  };

  const handleCompletar = async () => {
    if (!cajeroId) return alert("Selecciona el cajero vendedor");
    try {
      const resp = await API.put(`/separados/${viewSeparado.id}/completar`, { cajero_id: parseInt(cajeroId) });
      
      if (window.confirm("¿Imprimir comprobante de entrega?")) {
        API.get(`/ventas/${resp.data.factura_id}`)
          .then(resVentas => {
            const cajeroName = cajeros.find(c => c.id.toString() === cajeroId)?.nombre || "Principal";
            setFacturaPrintData({
              cabecera: {
                id: resp.data.factura_id,
                cliente: viewSeparado.cliente_nombre || "Casual",
                fecha: new Date().toISOString(),
                total: viewSeparado.total,
                metodo_pago: "Efectivo",
                cajero: cajeroName
              },
              detalles: resVentas.data
            });
            setTimeout(() => reactToPrintFactura(), 200);
          })
          .catch(console.error);
      }
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al completar venta");
    }
  };

  const handleAnular = async () => {
    if (!window.confirm("¿Anular este separado?")) return;
    try {
      await API.put(`/separados/${viewSeparado.id}/anular`);
      openView(viewSeparado.id);
      fetchSeparados();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al anular");
    }
  };

  const handlePrintSeparado = () => {
    setSeparadoPrintData({separado: viewSeparado, abonos: viewAbonos});
    setTimeout(() => {
      reactToPrintSeparado();
    }, 200);
  };

  const filteredSeparados = separados.filter(s => {
    const term = termSeparado.toLowerCase();
    const isIdMatch = s.id.toString().includes(term);
    const isNameMatch = s.cliente_nombre && s.cliente_nombre.toLowerCase().includes(term);
    const isDocMatch = s.cliente_documento && s.cliente_documento.toLowerCase().includes(term);
    return isIdMatch || isNameMatch || isDocMatch;
  });

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      <div className="no-print space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200">
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    Sistema de Separados
                </h1>
                <p className="text-slate-500 font-medium text-lg italic">Gestión de créditos, abonos parciales y liquidación de mercancía.</p>
            </div>
            <button 
                onClick={() => setShowNewModal(true)}
                className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all"
            >
                + Iniciar Separado
            </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors text-xl">🔍</span>
            <input 
                type="text" 
                placeholder="Localizar separado por cliente, ID o documento..." 
                value={termSeparado} 
                onChange={e => setTermSeparado(e.target.value)} 
                className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[32px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all shadow-sm"
            />
        </div>

        {/* List Card */}
        <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span> Carteras Pendientes
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-1 bg-white border border-slate-100 rounded-full">
                    {filteredSeparados.length} Registros Activos
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                            <th className="px-8 py-5">Control #</th>
                            <th className="px-8 py-5">Titular del Separado</th>
                            <th className="px-8 py-5 text-center">Valor Base</th>
                            <th className="px-8 py-5 text-center">Saldo Residual</th>
                            <th className="px-8 py-5 text-center">Progreso</th>
                            <th className="px-8 py-5 text-center">Estatus</th>
                            <th className="px-8 py-5 text-center">Opciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando estado de carteras...</td></tr>
                        ) : filteredSeparados.length === 0 ? (
                            <tr><td colSpan={7} className="py-24 text-center text-slate-300 font-bold italic opacity-50">No hay registros para mostrar.</td></tr>
                        ) : (
                            filteredSeparados.map(s => {
                                const pagado = parseFloat(s.total) - parseFloat(s.saldo_pendiente);
                                const pct = (pagado / parseFloat(s.total)) * 100;
                                return (
                                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openView(s.id)}>
                                        <td className="px-8 py-6 font-black text-slate-400">#{(s.id).toString().padStart(4, '0')}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase leading-tight">{s.cliente_nombre || "Cliente Casual"}</div>
                                            <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Desde: {new Date(s.fecha_creacion).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-slate-600 text-xs">{formatCOP(s.total)}</td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`font-black text-lg tracking-tighter ${parseFloat(s.saldo_pendiente) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {formatCOP(s.saldo_pendiente)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                s.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 
                                                s.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {s.estado}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button className="px-5 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">Abrir</button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL: New Separado */}
        {showNewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowNewModal(false)}></div>
                <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-400 flex flex-col max-h-[90vh]">
                    <div className="p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Nuevo Separado</h2>
                        <button onClick={() => setShowNewModal(false)} className="text-3xl text-slate-300 hover:text-slate-500 transition-colors">&times;</button>
                    </div>
                    
                    <div className="p-10 flex-1 overflow-y-auto space-y-8 scrollbar-none">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Cliente</label>
                            {newClienteId ? (
                                <div className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-3xl">
                                    <span className="font-black text-emerald-800 uppercase tracking-tight">
                                        {clientes.find(c => c.id.toString() === newClienteId)?.nombre}
                                    </span>
                                    <button onClick={() => setNewClienteId("")} className="text-emerald-300 hover:text-emerald-600 font-black">QUITAR</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input type="text" value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} placeholder="Escriba nombre o cédula..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-50" />
                                    {clienteSearch && (
                                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-10 mt-2 overflow-hidden max-h-48 overflow-y-auto">
                                            {clientes.filter(c => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || (c.documento && c.documento.includes(clienteSearch))).map(c => (
                                                <div key={c.id} onClick={() => { setNewClienteId(c.id.toString()); setClienteSearch(""); }} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 text-sm font-bold text-slate-700 uppercase">
                                                    {c.nombre} <span className="text-[10px] text-slate-400 ml-2">ID: {c.documento}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mercancía a Retener</label>
                            <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Escriba referencia o nombre ítem..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-50" />
                            {prodSearch && (
                                <div className="bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                    {productos.filter(p => p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || (p.referencia && p.referencia.toLowerCase().includes(prodSearch.toLowerCase()))).map(p => (
                                        <div key={p.id} onClick={() => addProdToCart(p)} className="p-4 hover:bg-amber-50 cursor-pointer border-b border-slate-50 flex justify-between items-center transition-colors">
                                            <div className="text-xs font-black text-slate-800 uppercase leading-tight">{p.nombre}</div>
                                            <div className="font-black text-amber-600 text-xs">{formatCOP(p.precio_venta)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2 mt-4">
                                {cart.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-xs font-black text-slate-700 uppercase">x{c.qty} {c.nombre}</div>
                                        <div className="text-xs font-black text-slate-400">{formatCOP(c.precio_venta * c.qty)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Total Acumulado</label>
                                <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {formatCOP(cart.reduce((a,c) => a + c.precio_venta*c.qty, 0))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 block">Carga Inicial ($)</label>
                                <input type="number" value={initialPayment} onChange={e => setInitialPayment(e.target.value)} placeholder="0.00" className="w-full px-5 py-3 bg-amber-50 border border-amber-100 rounded-2xl font-black text-amber-700 text-xl outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                        <button onClick={() => setShowNewModal(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Cancelar</button>
                        <button onClick={handleCreate} className="flex-[2] py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs">Registrar Compromiso</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: View/Manage Separado */}
        {viewSeparado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setViewSeparado(null)}></div>
                <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-400">
                    <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Auditoría #{(viewSeparado.id).toString().padStart(4, '0')}
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{viewSeparado.estado}</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-sm uppercase px-1">Titular: {viewSeparado.cliente_nombre}</p>
                        </div>
                        <button onClick={() => setViewSeparado(null)} className="text-3xl text-slate-300 hover:text-slate-500 font-black">&times;</button>
                    </div>

                    <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-none">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paquete Bloqueado</h4>
                            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-3">
                                {(() => {
                                    const items = typeof viewSeparado.detalles_json === 'string' ? JSON.parse(viewSeparado.detalles_json) : viewSeparado.detalles_json;
                                    return items.map((itm: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700 border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                            <span>{itm.qty || itm.cantidad}x <span className="uppercase text-slate-400">{itm.nombre}</span></span>
                                            <span className="font-black">{formatCOP(itm.precio_venta * (itm.qty || itm.cantidad))}</span>
                                        </div>
                                    ));
                                })()}
                                <div className="pt-3 flex justify-between items-end">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión Lote</span>
                                    <span className="text-xl font-black text-slate-900 tracking-tighter">{formatCOP(viewSeparado.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trayectoria de Pagos</h4>
                            <div className="space-y-3">
                                {viewAbonos.length > 0 ? viewAbonos.map(a => (
                                    <div key={a.id} className="flex justify-between items-center p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic">{new Date(a.fecha_abono).toLocaleDateString()}</div>
                                        <div className="font-black text-emerald-600 text-sm">+{formatCOP(a.monto)}</div>
                                    </div>
                                )) : <p className="text-center py-6 text-slate-300 font-bold italic text-sm">Sin movimientos recientes.</p>}
                            </div>
                        </div>

                        {viewSeparado.estado === 'Pendiente' && (
                            <div className="pt-6 border-t border-slate-100 space-y-6">
                                {parseFloat(viewSeparado.saldo_pendiente) > 0 ? (
                                    <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Deuda Restante</span>
                                            <span className="text-2xl font-black text-amber-700 tracking-tighter">{formatCOP(viewSeparado.saldo_pendiente)}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <input type="number" placeholder="Ingresar Abono..." value={abonoInput} onChange={e => setAbonoInput(e.target.value)} className="flex-1 px-5 py-3 bg-white border border-amber-200 rounded-2xl font-black text-amber-700 outline-none" />
                                            <button onClick={handleAbonar} className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200">Abonar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 text-center space-y-5">
                                        <div className="text-4xl">🏁</div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-emerald-800 text-lg uppercase tracking-tight">¡Total Liquidado!</h4>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ya puedes entregar la mercancía al cliente.</p>
                                        </div>
                                        <select value={cajeroId} onChange={e => setCajeroId(e.target.value)} className="w-full px-5 py-3 bg-white border border-emerald-200 rounded-2xl font-black text-emerald-700 outline-none uppercase text-xs">
                                            <option value="">-- Cajero Vendedor --</option>
                                            {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                        <button onClick={handleCompletar} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Finalizar y Descontar Inventario</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-10 bg-slate-900 flex justify-between items-center gap-6">
                        {viewSeparado.estado === 'Pendiente' ? (
                            <button onClick={handleAnular} className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors underline underline-offset-4">Anular Todo</button>
                        ) : <div/>}
                        <div className="flex gap-4">
                            <button onClick={handlePrintSeparado} className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2 border border-white/10">
                                🖨️ PDF Recibo
                            </button>
                            <button onClick={() => setViewSeparado(null)} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        {facturaPrintData && (
          <PrintReceipt
            ref={facturaContentRef}
            empresa={empresa}
            numero={facturaPrintData.cabecera.id}
            fecha={facturaPrintData.cabecera.fecha}
            cliente={facturaPrintData.cabecera.cliente}
            cajero={facturaPrintData.cabecera.cajero}
            metodoPago="Efectivo"
            items={facturaPrintData.detalles}
            total={facturaPrintData.cabecera.total}
          />
        )}

        {separadoPrintData && (
          <PrintReceipt
            ref={separadoContentRef}
            empresa={empresa}
            numero={`SEP-${separadoPrintData.separado.id}`}
            fecha={separadoPrintData.separado.fecha_creacion}
            cliente={separadoPrintData.separado.cliente_nombre}
            cajero={cajeros.find(c => c.id == separadoPrintData.separado.cajero_id)?.nombre || undefined}
            items={typeof separadoPrintData.separado.detalles_json === 'string' ? JSON.parse(separadoPrintData.separado.detalles_json) : separadoPrintData.separado.detalles_json}
            total={parseFloat(separadoPrintData.separado.total)}
            isSeparado={true}
            totalAbonado={parseFloat(separadoPrintData.separado.total) - parseFloat(separadoPrintData.separado.saldo_pendiente)}
            saldoPendiente={parseFloat(separadoPrintData.separado.saldo_pendiente)}
            historialPagos={separadoPrintData.abonos}
          />
        )}
      </div>

    </div>
  );
}
