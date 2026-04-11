export const formatCOP = (value:any) => {
  if (isNaN(value)) return "$ 0";
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDateTime = (date: any) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString('es-CO', { 
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
