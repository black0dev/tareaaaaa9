import Link from "next/link";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import type { GalleryImage } from "@/components/product/ImageGallery";
import type { VariantOption } from "@/components/product/VariantSelector";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string | null;
  brand: string | null;
  category_name: string | null;
}

interface ImageRow {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string | null;
  price_amount: number;
  stock_quantity: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from("v_active_products")
    .select("id, name, slug, description, material, brand, category_name")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to fetch product:", error.message);
    return null;
  }

  return data as ProductRow | null;
}

async function getProductImages(productId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("v_product_gallery")
    .select("id, image_url, alt_text, is_primary, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch images:", error.message);
    return [];
  }

  return ((data as ImageRow[]) || []).map((img) => ({
    id: img.id,
    image_url: img.image_url,
    alt_text: img.alt_text,
    is_primary: img.is_primary,
  }));
}

async function getProductVariants(
  productId: string
): Promise<VariantOption[]> {
  // Consultamos product_variants directamente (no la vista) para incluir
  // variantes sin stock y poder mostrar el estado "Agotado".
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, sku, size, color, price_amount, stock_quantity")
    .eq("product_id", productId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("size");

  if (error) {
    console.error("Failed to fetch variants:", error.message);
    return [];
  }

  return ((data as VariantRow[]) || []).map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    price_amount: v.price_amount,
    stock_quantity: v.stock_quantity,
    sku: v.sku,
  }));
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Producto no encontrado
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Producto no encontrado
          </h1>
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            El producto que buscas no existe o no está disponible.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/catalogo">
              <Button variant="outline">Ver catálogo</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Obtener datos complementarios en paralelo
  const [images, variants] = await Promise.all([
    getProductImages(product.id),
    getProductVariants(product.id),
  ]);

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        material: product.material,
        brand: product.brand,
        category_name: product.category_name,
        images,
        variants,
      }}
    />
  );
}
