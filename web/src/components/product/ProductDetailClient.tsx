"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ImageGallery, {
  type GalleryImage,
} from "@/components/product/ImageGallery";
import VariantSelector, {
  type VariantOption,
} from "@/components/product/VariantSelector";
import CartToast from "@/components/cart/CartToast";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string | null;
  brand: string | null;
  category_name: string | null;
  images: GalleryImage[];
  variants: VariantOption[];
}

interface ProductDetailClientProps {
  product: ProductDetailData;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { addItem } = useCart();

  // Precio a mostrar: el de la variante seleccionada o el precio minimo
  const displayPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price_amount;
    if (product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v) => v.price_amount));
  }, [selectedVariant, product.variants]);

  // Determinar si el boton de agregar al carrito debe estar habilitado
  const canAddToCart =
    selectedVariant !== null && selectedVariant.stock_quantity > 0;

  const isOutOfStock = selectedVariant !== null && selectedVariant.stock_quantity === 0;

  // Imagen primaria para el carrito
  const primaryImage = product.images.find((img) => img.is_primary);
  const primaryImageUrl = primaryImage?.image_url || product.images[0]?.image_url || null;

  // Handler para agregar al carrito
  const handleAddToCart = useCallback(() => {
    if (!selectedVariant) return;

    const variantLabel = selectedVariant.color
      ? `${selectedVariant.size} / ${selectedVariant.color}`
      : selectedVariant.size;

    addItem({
      product_id: product.id,
      product_slug: product.slug,
      variant_id: selectedVariant.id,
      product_name: product.name,
      variant_label: variantLabel,
      size: selectedVariant.size,
      color: selectedVariant.color,
      sku: selectedVariant.sku,
      price_amount: selectedVariant.price_amount,
      primary_image_url: primaryImageUrl,
    });

    setToastMessage(`${product.name} (${variantLabel}) agregado al carrito`);
  }, [selectedVariant, product, addItem, primaryImageUrl]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link
          href="/catalogo"
          className="hover:text-indigo-600 transition-colors"
        >
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Layout principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Galeria de imagenes */}
        <div>
          <ImageGallery images={product.images} />
        </div>

        {/* Informacion del producto */}
        <div className="flex flex-col">
          {/* Categoria */}
          {product.category_name && (
            <p className="text-sm font-medium text-indigo-600 mb-2">
              {product.category_name}
            </p>
          )}

          {/* Nombre */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Precio */}
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-indigo-600">
            {displayPrice > 0 ? formatPrice(displayPrice) : "—"}
          </p>

          {/* Descripcion */}
          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-2">
                Descripción
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Material y marca */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {product.material && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </h3>
                <p className="mt-1 text-sm text-gray-900">{product.material}</p>
              </div>
            )}
            {product.brand && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca
                </h3>
                <p className="mt-1 text-sm text-gray-900">{product.brand}</p>
              </div>
            )}
          </div>

          {/* Selector de variantes */}
          {product.variants.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <VariantSelector
                variants={product.variants}
                onSelect={setSelectedVariant}
              />
            </div>
          )}

          {/* Boton de agregar al carrito */}
          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
            >
              {isOutOfStock
                ? "Agotado"
                : !selectedVariant
                  ? "Selecciona talla y color"
                  : `Agregar al carrito — ${formatPrice(selectedVariant.price_amount)}`}
            </Button>

            <Link href="/catalogo">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
              >
                Volver al catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Toast de feedback */}
      {toastMessage && (
        <CartToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 h-4 bg-gray-200 rounded w-48" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Imagen skeleton */}
        <div className="aspect-square bg-gray-200 rounded-xl" />

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
