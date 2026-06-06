/**
 * Capa de acceso a datos — Reemplaza Supabase por la API FastAPI real.
 * Misma API que supabase.from("tabla").select("*") pero usando nuestro backend.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function apiGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.ok ? json.data : []) as T[];
}

async function apiGetOne<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) return null;
  const json = await res.json();
  return (json.ok ? json.data : null) as T | null;
}

// --- Productos ---
export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  variants: VariantData[];
  primary_image_url: string | null;
  material?: string | null;
  brand?: string | null;
}

export interface VariantData {
  id: string;
  size: string;
  color: string;
  price_amount: number;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
}

export interface ImageData {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface OrderStats {
  total_pending: number;
  total_today: number;
  low_stock: number;
  active_products: number;
}

export async function getActiveProducts(limit = 20): Promise<ProductData[]> {
  return apiGet<ProductData>(`/products?limit=${limit}`);
}

export async function getProductBySlug(slug: string): Promise<(ProductData & { images: ImageData[] }) | null> {
  return apiGetOne<ProductData & { images: ImageData[] }>(`/products/${slug}`);
}

export async function getCategories(): Promise<CategoryData[]> {
  return apiGet<CategoryData>("/categories");
}

export async function getProductDetail(slug: string): Promise<any | null> {
  return apiGetOne(`/products/${slug}`);
}

export async function getOrderStats(): Promise<OrderStats> {
  try {
    const res = await fetch(`${API}/admin/orders?page=1&page_size=1`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}` },
    });
    const pendingRes = await fetch(`${API}/admin/orders?page=1&page_size=1&status=pendiente_pago`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}` },
    });
    const pending = await pendingRes.json();
    const all = await res.json();

    return {
      total_pending: pending?.meta?.total || 0,
      total_today: all?.meta?.total || 0,
      low_stock: 0,
      active_products: 0,
    };
  } catch {
    return { total_pending: 0, total_today: 0, low_stock: 0, active_products: 0 };
  }
}
