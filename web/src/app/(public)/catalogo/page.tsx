import { supabase } from "@/lib/supabase";
import CatalogClient from "@/components/product/CatalogClient";
import type { ProductCardData } from "@/components/product/ProductCard";

export const metadata = {
  title: "Catálogo - Tienda Camisetas",
  description:
    "Explora nuestra colección de camisetas con diseños exclusivos.",
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
}

interface VariantRow {
  product_id: string;
  stock_quantity: number;
  price_amount: number;
}

interface ImageRow {
  product_id: string;
  image_url: string;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function getAllProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("v_active_products")
    .select("id, name, slug, description, category_id, category_name, category_slug")
    .order("name");

  if (error) {
    console.error("Failed to fetch products:", error.message);
    return [];
  }
  return (data as ProductRow[]) || [];
}

async function getVariantsData(): Promise<Map<string, { total_stock: number; min_price: number }>> {
  const { data, error } = await supabase
    .from("v_active_variants")
    .select("product_id, stock_quantity, price_amount");

  if (error) {
    console.error("Failed to fetch variants:", error.message);
    return new Map();
  }

  const variants = data as VariantRow[] | null;
  const map = new Map<string, { total_stock: number; min_price: number }>();

  for (const v of variants || []) {
    const existing = map.get(v.product_id);
    if (existing) {
      existing.total_stock += v.stock_quantity;
      if (v.price_amount < existing.min_price) {
        existing.min_price = v.price_amount;
      }
    } else {
      map.set(v.product_id, {
        total_stock: v.stock_quantity,
        min_price: v.price_amount,
      });
    }
  }

  return map;
}

async function getPrimaryImages(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("v_product_gallery")
    .select("product_id, image_url")
    .eq("is_primary", true);

  if (error) {
    console.error("Failed to fetch images:", error.message);
    return new Map();
  }

  const images = data as ImageRow[] | null;
  const map = new Map<string, string>();

  for (const img of images || []) {
    if (!map.has(img.product_id)) {
      map.set(img.product_id, img.image_url);
    }
  }

  return map;
}

async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }
  return (data as CategoryRow[]) || [];
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function CatalogoPage() {
  const [products, variantsMap, imagesMap, categories] = await Promise.all([
    getAllProducts(),
    getVariantsData(),
    getPrimaryImages(),
    getCategories(),
  ]);

  const catalogProducts: ProductCardData[] = products.map((p) => {
    const vData = variantsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price_amount: vData?.min_price ?? 0,
      primary_image_url: imagesMap.get(p.id) ?? null,
      total_stock: vData?.total_stock ?? 0,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Catálogo
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500">
          Explora nuestra colección de camisetas
        </p>
      </div>

      {products.length === 0 ? (
        /* Estado vacio (sin productos en BD) */
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No hay productos disponibles
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            No hay productos disponibles en este momento.
          </p>
        </div>
      ) : (
        <CatalogClient
          initialProducts={catalogProducts}
          categories={categories}
        />
      )}
    </div>
  );
}
