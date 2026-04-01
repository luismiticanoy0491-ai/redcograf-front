export interface Producto {
  id?: number;
  referencia: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio_compra: number;
  porcentaje_ganancia: number;
  precio_venta: number;
}

export interface Cajero {
  id: number;
  nombre: string;
  identificacion: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  identificacion: string;
  telefono?: string;
  direccion?: string;
}

export interface Proveedor {
  id: number;
  nit: string;
  nombre_comercial: string;
  razon_social?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface FacturaVenta {
  id: number;
  fecha: string;
  total: number;
  metodo_pago: string;
  cajero: string;
  cliente: string;
  estado?: string;
}

export interface Borrador {
  id: number;
  fecha: string;
  proveedor: string;
  numero_factura: string;
  detalles: ProductoIngresado[];
}

export interface ProductoIngresado extends Producto {
  inyectado?: boolean;
}

export interface CartItem extends Producto {
  qty: number;
}
