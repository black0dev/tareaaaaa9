"use client";

import { useState, useEffect, useCallback } from "react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminRequest } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import ProductForm from "@/components/admin/ProductForm";
import StockAdjustmentModal from "@/components/admin/StockAdjustmentModal";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  base_price: number;
  primary_image_url: string | null;
  is_active: boolean;
  variants_count: number;
  total_stock: number;
  variants?: VariantItem[];
}

interface VariantItem {
  id: string;
  size: string;
  color: string;
  price_amount: number;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
}

interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
  const [stockModal, setStockModal] = useState<{
    product: ProductItem;
    variant: VariantItem;
  } | null>(null);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "20");
        if (search) params.set("search", search);

        const res = await adminRequest<{
          ok: boolean;
          data: ProductItem[];
          meta: PaginationMeta;
        }>(`/admin/products?${params.toString()}`);

        setProducts(res.data || []);
        setPagination(
          res.meta || { total: 0, page: 1, page_size: 20, total_pages: 1 }
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar productos"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  async function handleToggleActive(product: ProductItem) {
    try {
      await adminRequest(`/admin/products/${product.id}`, {
        method: "PUT",
        body: { is_active: !product.is_active },
      });
      fetchProducts(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  }

  function handleEdit(product: ProductItem) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleNew() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts(pagination.page);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Button size="sm" onClick={handleNew}>
          Nuevo producto
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="py-3">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchProducts(1)}
            >
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fetchProducts(1)}
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500">Cargando productos...</p>
            </div>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No hay productos registrados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Crea tu primer producto usando el botón superior.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.variants_count} variante(s)
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.category_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={
                          product.total_stock === 0
                            ? "text-red-600"
                            : product.total_stock < 5
                            ? "text-yellow-600"
                            : "text-green-600"
                        }
                      >
                        {product.total_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`p-1.5 transition-colors ${
                            product.is_active
                              ? "text-gray-400 hover:text-red-600"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                          title={product.is_active ? "Desactivar" : "Activar"}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {product.is_active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Mostrando {(pagination.page - 1) * pagination.page_size + 1}–
                {Math.min(pagination.page * pagination.page_size, pagination.total)}{" "}
                de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProducts(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchProducts(pagination.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct as unknown as Parameters<typeof ProductForm>[0]["product"]}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={handleFormSaved}
        />
      )}

      {stockModal && stockModal.variant && (
        <StockAdjustmentModal
          variantId={stockModal.variant.id}
          variantLabel={`${stockModal.product.name} - ${stockModal.variant.size} / ${stockModal.variant.color} (SKU: ${stockModal.variant.sku})`}
          currentStock={stockModal.variant.stock_quantity}
          onClose={() => setStockModal(null)}
          onAdjusted={() => {
            setStockModal(null);
            fetchProducts(pagination.page);
          }}
        />
      )}
    </div>
  );
}
