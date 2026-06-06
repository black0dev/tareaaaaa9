"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminRequest } from "@/lib/api";

interface StockAdjustmentModalProps {
  variantId: string;
  variantLabel: string;
  currentStock: number;
  onClose: () => void;
  onAdjusted: () => void;
}

export default function StockAdjustmentModal({
  variantId,
  variantLabel,
  currentStock,
  onClose,
  onAdjusted,
}: StockAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newStock = currentStock + adjustment;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (adjustment === 0) {
      setError("El ajuste no puede ser 0.");
      return;
    }

    if (newStock < 0) {
      setError("El stock no puede quedar negativo.");
      return;
    }

    setIsSaving(true);
    try {
      await adminRequest("/admin/stock/adjustments", {
        method: "POST",
        body: {
          product_variant_id: variantId,
          adjustment,
          notes: notes || undefined,
        },
      });
      onAdjusted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ajustar stock.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Ajustar stock
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-600">{variantLabel}</p>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                Stock actual:{" "}
                <span className="font-semibold text-gray-900">{currentStock}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ajuste (positivo = sumar, negativo = restar)
              </label>
              <Input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                Nuevo stock:{" "}
                <span
                  className={`font-semibold ${
                    newStock < 0
                      ? "text-red-600"
                      : newStock === 0
                      ? "text-red-600"
                      : newStock < 5
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {newStock}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Devolución, ajuste de inventario..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={newStock < 0}
              >
                Ajustar stock
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
