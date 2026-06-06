/**
 * Formatea un precio en centavos a una cadena legible en soles peruanos.
 * Ejemplo: 3990 → "S/ 39.90"
 */
export function formatPrice(cents: number): string {
  const soles = cents / 100;
  return `S/ ${soles.toFixed(2)}`;
}

/**
 * Retorna una etiqueta y variante visual según la cantidad de stock.
 */
export function formatStock(quantity: number): {
  label: string;
  variant: "success" | "warning" | "error";
} {
  if (quantity === 0) {
    return { label: "Agotado", variant: "error" };
  }
  if (quantity < 5) {
    return { label: "Pocas unidades", variant: "warning" };
  }
  return { label: "En stock", variant: "success" };
}

/**
 * Variantes de color para los badges de stock.
 */
export const STOCK_VARIANT_STYLES: Record<
  "success" | "warning" | "error",
  string
> = {
  success:
    "bg-green-100 text-green-800 border-green-200",
  warning:
    "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
};
