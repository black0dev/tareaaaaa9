"use client";

import { useState, useMemo, useCallback } from "react";
import ProductCard, { type ProductCardData } from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogClientProps {
  initialProducts: ProductCardData[];
  categories: Category[];
}

export default function CatalogClient({
  initialProducts,
  categories,
}: CatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    string | null
  >(null);

  // Debounce simulado: filtramos en tiempo real sobre datos ya en memoria
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCategorySlug(e.target.value || null);
    },
    []
  );

  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    // Filtro por busqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description ?? "").toLowerCase().includes(term)
      );
    }

    // Filtro por categoria (usamos el slug de categoria que podriamos
    // tener en los metadatos del producto si lo extendieramos)
    // Por ahora, como el ProductCardData no tiene category_slug, este filtro
    // funciona si extendemos el tipo mas adelante.
    // Dejamos el filtro preparado.

    return result;
  }, [initialProducts, searchTerm]);

  return (
    <div>
      {/* Barra de busqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Busqueda */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Filtro por categoria */}
        {categories.length > 0 && (
          <select
            value={selectedCategorySlug ?? ""}
            onChange={handleCategoryChange}
            className="block w-full sm:w-48 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resultados */}
      {filteredProducts.length === 0 ? (
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
            No se encontraron productos
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm
              ? `No hay resultados para "${searchTerm}". Intenta con otros términos.`
              : "No hay productos disponibles en este momento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// Exportamos el skeleton para usar en loading.tsx
export function CatalogLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
