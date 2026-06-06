"use client";

import { useState, useEffect, FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminRequest } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id?: string;
  size: string;
  color: string;
  price_amount: number;
  stock_quantity: number;
  sku: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ImageData {
  id?: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  isNew?: boolean;
  file?: File;
}

interface ProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  material: string;
  brand: string;
  base_price: number;
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    material: string | null;
    brand: string | null;
    base_price: number;
    category_id: string | null;
    variants?: Variant[];
    images?: ImageData[];
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ProductData>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    material: product?.material || "",
    brand: product?.brand || "",
    base_price: product?.base_price || 0,
  });

  const [variants, setVariants] = useState<Variant[]>(
    (product?.variants || []).map((v) => ({ ...v, isNew: false, isDeleted: false }))
  );

  const [images, setImages] = useState<ImageData[]>(
    (product?.images || []).map((img, i) => ({
      ...img,
      sort_order: img.sort_order ?? i + 1,
      isNew: false,
    }))
  );

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (data) setCategories(data as Category[]);
    }
    loadCategories();
  }, []);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value: string) {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        size: "",
        color: "",
        price_amount: 0,
        stock_quantity: 0,
        sku: "",
        isNew: true,
        isDeleted: false,
      },
    ]);
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, isDeleted: true } : v))
    );
  }

  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        {
          url: previewUrl,
          alt_text: "",
          is_primary: prev.length === 0,
          sort_order: prev.length + 1,
          isNew: true,
          file,
        },
      ]);
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function setPrimaryImage(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === index }))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.slug) {
      setError("Nombre y slug son requeridos.");
      return;
    }

    setIsSaving(true);

    try {
      let productId = product?.id;

      if (isEdit) {
        const res = await adminRequest<{
          ok: boolean;
          data: { id: string };
        }>(`/admin/products/${productId}`, {
          method: "PUT",
          body: {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            category_id: formData.category_id || null,
            material: formData.material || null,
            brand: formData.brand || null,
            base_price: formData.base_price,
          },
        });
        productId = res.data.id;
      } else {
        const res = await adminRequest<{
          ok: boolean;
          data: { id: string };
        }>(`/admin/products`, {
          method: "POST",
          body: {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            category_id: formData.category_id || null,
            material: formData.material || null,
            brand: formData.brand || null,
            base_price: formData.base_price,
          },
        });
        productId = res.data.id;
      }

      for (const variant of variants) {
        if (variant.isDeleted) {
          if (variant.id) {
            await adminRequest(`/admin/variants/${variant.id}`, {
              method: "DELETE",
            });
          }
          continue;
        }

        if (variant.id && !variant.isNew) {
          await adminRequest(`/admin/variants/${variant.id}`, {
            method: "PUT",
            body: {
              size: variant.size,
              color: variant.color,
              price_amount: variant.price_amount,
              stock_quantity: variant.stock_quantity,
              sku: variant.sku,
            },
          });
        } else if (variant.isNew) {
          await adminRequest(`/admin/products/${productId}/variants`, {
            method: "POST",
            body: {
              size: variant.size,
              color: variant.color,
              price_amount: variant.price_amount,
              stock_quantity: variant.stock_quantity,
              sku: variant.sku,
            },
          });
        }
      }

      for (const img of images) {
        if (img.isNew && img.file) {
          const formDataImg = new FormData();
          formDataImg.append("file", img.file);
          if (img.alt_text) formDataImg.append("alt_text", img.alt_text);

          const token = localStorage.getItem("admin_token");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/admin/products/${productId}/images`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formDataImg,
            }
          );
          const json = await res.json();
          const imageId = json.data?.id;

          if (imageId && img.is_primary) {
            await adminRequest(`/admin/images/${imageId}/primary`, {
              method: "PUT",
            });
          }
        } else if (img.id && img.is_primary) {
          await adminRequest(`/admin/images/${img.id}/primary`, {
            method: "PUT",
          });
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  const activeVariants = variants.filter((v) => !v.isDeleted);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <Input
                label="Slug *"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.category_id}
                  onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Precio base (centavos)"
                type="number"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, base_price: parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Material"
                value={formData.material}
                onChange={(e) => setFormData((p) => ({ ...p, material: e.target.value }))}
              />
              <Input
                label="Marca"
                value={formData.brand}
                onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Variantes</h3>
                <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                  + Agregar variante
                </Button>
              </div>

              {activeVariants.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay variantes. Agrega al menos una.
                </p>
              )}

              {activeVariants.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {variants.map((v, i) => {
                        if (v.isDeleted) return null;
                        return (
                          <tr key={i}>
                            <td className="px-3 py-2">
                              <input
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={v.size}
                                onChange={(e) => updateVariant(i, "size", e.target.value)}
                                placeholder="Ej: M"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={v.color}
                                onChange={(e) => updateVariant(i, "color", e.target.value)}
                                placeholder="Ej: Negro"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={v.sku}
                                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                                placeholder="SKU"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="w-24 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={v.price_amount}
                                onChange={(e) => updateVariant(i, "price_amount", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={v.stock_quantity}
                                onChange={(e) => updateVariant(i, "stock_quantity", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeVariant(i)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Imágenes</h3>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`relative w-24 h-24 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                      img.is_primary ? "border-indigo-500" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || `Imagen ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-1 bg-black/50">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(i)}
                        className={`text-white text-[10px] px-1 rounded ${
                          img.is_primary ? "bg-indigo-500" : "bg-gray-500"
                        }`}
                        title="Principal"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="text-white text-[10px] px-1 bg-red-500 rounded"
                        title="Eliminar"
                      >
                        X
                      </button>
                    </div>
                    {img.is_primary && (
                      <span className="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] px-1 rounded-br">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {isEdit ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
