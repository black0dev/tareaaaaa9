import Link from "next/link";
import { formatPrice, formatStock, STOCK_VARIANT_STYLES } from "@/lib/format";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_amount: number;
  primary_image_url: string | null;
  /** Stock total agregado de todas las variantes activas con stock */
  total_stock: number;
}

interface ProductCardProps {
  product: ProductCardData;
}

export default function ProductCard({ product }: ProductCardProps) {
  const stock = formatStock(product.total_stock);
  const isOutOfStock = product.total_stock === 0;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group block relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md"
    >
      {/* Imagen */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Overlay de agotado */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-indigo-600">
            {formatPrice(product.price_amount)}
          </p>

          {/* Badge de stock */}
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STOCK_VARIANT_STYLES[stock.variant]}`}
          >
            {stock.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
