import React, { useState, useEffect } from "react";
import API from "../api/api";
import { Producto } from "../types";

function AjustesInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Mantenemos un estado local con las cantidades que el usuario teclea
  const [cantidadesCambiadas, setCantidadesCambiadas] = useState<Record<number, number | string>>({});

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = () => {
    setLoading(true);
    API.get("/productos")
      .then(res => {
        setProductos(res.data);
        const initialCant: Record<number, number> = {};
        res.data.forEach((p: Producto) => initialCant[p.id as number] = p.cantidad);
        setCantidadesCambiadas(initialCant);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCantChange = (id: number, newValor: string | number) => {
    setCantidadesCambiadas({...cantidadesCambiadas, [id]: newValor});
  };

  const handleSum = (id: number, amount: number) => {
    const val = cantidadesCambiadas[id];
    let current = 0;
    if (val !== undefined && val !== null && val !== '') {
        current = parseInt(String(val), 10);
    }
    setCantidadesCambiadas({...cantidadesCambiadas, [id]: current + amount});
  };

  const handleGuardar = (producto: Producto) => {
    const rawLocal = cantidadesCambiadas[producto.id as number];
    let nuevaCantidad = 0;

    if (typeof rawLocal === 'string' && rawLocal.trim().startsWith('+')) {
      const delta = parseInt(rawLocal.replace('+', ''), 10);
      if (isNaN(delta)) return alert("Número inválido.");
      nuevaCantidad = producto.cantidad + delta;
    } else {
      nuevaCantidad = parseInt(String(rawLocal), 10);
    }
    
    if (isNaN(nuevaCantidad)) return alert("Número inválido.");
    if (nuevaCantidad === producto.cantidad) return;

    if (!window.confirm(`¿Ajustar stock de ${producto.nombre} a ${nuevaCantidad} unidades?`)) return;

    setUpdatingId(producto.id as number);
    API.put(`/productos/${producto.id}/ajustar`, { nueva_cantidad: nuevaCantidad })
      .then(() => {
        fetchProductos();
      })
      .catch(console.error)
      .finally(() => setUpdatingId(null));
  };

  const normalizeStr = (str: string | number) => {
    if (str === null || str === undefined) return "";
    return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const filtered = productos.filter((p: Producto) => {
    const s = normalizeStr(searchTerm);
    if (!s) return true;
    return normalizeStr(p.nombre).includes(s) || normalizeStr(p.referencia).includes(s) || normalizeStr(p.categoria).includes(s);
  });

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Ajustes de Inventario
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">Corrección manual de existencias por arqueo, mermas o sobrantes.</p>
        </div>
      </div>

      {/* Search Zone */}
      <div className="relative group mb-10">
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">🔍</span>
        <input 
          type="text" 
          placeholder="Localizar producto por nombre, categoría o SKU..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[32px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-sm"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span> Panel de Nivelación
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full">{filtered.length} Items en Pantalla</span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                        <th className="px-8 py-5">Control SKU</th>
                        <th className="px-8 py-5">Descripción del Artículo</th>
                        <th className="px-8 py-5 text-center">Stock Contable</th>
                        <th className="px-8 py-5 text-center">Muestreo Físico</th>
                        <th className="px-8 py-5 text-center">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading && productos.length === 0 ? (
                        <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando almacén...</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-bold italic opacity-50">No se encontraron productos para ajustar.</td></tr>
                    ) : (
                        filtered.map((p: Producto) => {
                            const valorLocal = cantidadesCambiadas[p.id as number];
                            const hasChanged = parseInt(String(valorLocal)) !== p.cantidad;

                            return (
                                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-400 text-xs">{(p.referencia || "SIN-SKU")}</td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-slate-900 uppercase leading-tight group-hover:text-indigo-600 transition-colors">{p.nombre}</div>
                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter italic">{p.categoria}</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            p.cantidad <= 0 ? 'bg-red-100 text-red-600' : 
                                            p.cantidad < 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {p.cantidad} UND
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => handleSum(p.id as number, -1)}
                                                className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                                            >-</button>
                                            <input 
                                                type="text" 
                                                value={valorLocal !== undefined ? valorLocal : ''}
                                                onChange={(e) => handleCantChange(p.id as number, e.target.value)}
                                                className={`w-20 text-center font-black py-2 rounded-2xl border outline-none focus:ring-4 transition-all ${
                                                    hasChanged ? 'bg-indigo-50 border-indigo-200 text-indigo-700 focus:ring-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 focus:ring-slate-100'
                                                }`}
                                            />
                                            <button 
                                                onClick={() => handleSum(p.id as number, 1)}
                                                className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-100 transition-all flex items-center justify-center shadow-sm"
                                            >+</button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button 
                                            onClick={() => handleGuardar(p)}
                                            disabled={!hasChanged || updatingId === p.id}
                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                hasChanged ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:-translate-y-1' : 'bg-slate-100 text-slate-300 pointer-events-none'
                                            }`}
                                        >
                                            {updatingId === p.id ? "⏳..." : "Sincronizar"}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}

export default AjustesInventario;
