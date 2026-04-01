import React, { useState, useEffect } from "react";
import API from "../api/api";
import "./AjustesInventario.css";
import { Producto } from "../types";

function AjustesInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Mantenemos un estado local con las cantidades que el usuario teclea (antes de enviarlas a DB)
  const [cantidadesCambiadas, setCantidadesCambiadas] = useState<Record<number, number | string>>({});

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = () => {
    setLoading(true);
    API.get("/productos")
      .then(res => {
        setProductos(res.data);
        // Reset local form copy
        const initialCant: Record<number, number> = {};
        res.data.forEach((p: Producto) => initialCant[p.id as number] = p.cantidad);
        setCantidadesCambiadas(initialCant);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCantChange = (id: number, newValor: string | number) => {
    // Solo permitimos números reales integrales mayores a 0 si se teclea, 
    // pero si es string vacío dejamos pasar para que el usario edite cómodamente.
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
      // El usuario tecleó explícitamente sumar (ej. "+8")
      const delta = parseInt(rawLocal.replace('+', ''), 10);
      if (isNaN(delta)) return alert("Ingresa un número válido a sumar.");
      nuevaCantidad = producto.cantidad + delta;
    } else {
      // Valor absoluto normal
      nuevaCantidad = parseInt(String(rawLocal), 10);
    }
    
    if (isNaN(nuevaCantidad)) {
      return alert("Ingresa un número válido.");
    }

    if (nuevaCantidad === producto.cantidad) {
      return alert("No hay cambios en la cantidad actual.");
    }

    if (!window.confirm(`¿Seguro que deseas sobrescribir el inventario físico de:\n${producto.nombre} a ${nuevaCantidad} unidades?`)) {
      return;
    }

    setUpdatingId(producto.id);
    API.put(`/productos/${producto.id}/ajustar`, { nueva_cantidad: nuevaCantidad })
      .then(res => {
        alert("✅ Inventario nivelado exitosamente.");
        fetchProductos();
      })
      .catch(err => {
        console.error(err);
        alert("Hubo un error al ajustar el producto.");
      })
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
    <div className="ajustes-layout fade-in">
      <div className="header-zone">
        <h2>⚖️ Análisis y Ajustes de Stock</h2>
        <p>Alinea tu inventario del sistema con la realidad física (Sobrantes, Pérdidas, Conteo Manual).</p>
      </div>

      <div className="search-zone card">
        <input 
          list="lista-busqueda-ajustes"
          type="text" 
          placeholder="🔎 Buscar producto por nombre, categoría o referencia SKU..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <datalist id="lista-busqueda-ajustes">
          {productos.map(p => (
             p.referencia || p.nombre ? <option key={p.id} value={p.referencia || p.nombre}>{p.nombre}</option> : null
          ))}
        </datalist>
      </div>

      <div className="table-zone card">
        {loading && productos.length === 0 ? (
          <p>Cargando inventario actual...</p>
        ) : (
          <div className="table-responsive">
            <table className="modern-table ajustes-table">
              <thead>
                <tr>
                  <th>Referencia SKU</th>
                  <th>Detalle del Producto</th>
                  <th style={{textAlign: 'center'}}>Stock Sistema</th>
                  <th style={{textAlign: 'center'}}>Ajuste Rápido (+ / -)</th>
                  <th style={{textAlign: 'center'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: Producto) => {
                  const valorLocal = cantidadesCambiadas[p.id as number];
                  const hasChanged = parseInt(valorLocal as string) !== p.cantidad;

                  return (
                    <tr key={p.id} className={p.cantidad === 0 ? "agotado-row" : ""}>
                      <td className="ref-cell">{p.referencia || "SIN REF"}</td>
                      <td>
                        <strong>{p.nombre}</strong> <br/>
                        <span className="badge">{p.categoria}</span>
                      </td>
                      
                      {/* Estado Original */}
                      <td align="center">
                        <span className={`stock-badge ${p.cantidad === 0 ? 'bad' : 'normal'}`}>
                          {p.cantidad} 
                        </span>
                      </td>

                      {/* Control de Alteracion */}
                      <td align="center">
                        <div className="stepper-control">
                          <button className="step-btn minus" onClick={() => handleSum(p.id as number, -1)}>-</button>
                          <input 
                            type="text" 
                            className="step-input"
                            value={valorLocal !== undefined ? valorLocal : ''}
                            onChange={(e) => handleCantChange(p.id as number, e.target.value)}
                            style={{ textAlign: 'center' }}
                            placeholder={p.cantidad.toString()}
                          />
                          <button className="step-btn plus" onClick={() => handleSum(p.id as number, 1)}>+</button>
                        </div>
                      </td>

                      {/* Boton Guardar Individual */}
                      <td align="center">
                         <button 
                           onClick={() => handleGuardar(p)}
                           disabled={!hasChanged || updatingId === p.id}
                           className={`btn-guardar-ajuste ${hasChanged ? 'active' : ''}`}
                         >
                           {updatingId === p.id ? "⏳..." : "Fijar Stock"}
                         </button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} align="center" style={{padding: '2rem'}}>Ningún producto coincide.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default AjustesInventario;
