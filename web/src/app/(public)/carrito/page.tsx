"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/Card";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();

  // ─── Carrito vacio ─────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          {/* Icono de bolsa vacia */}
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Explora nuestro catálogo y encuentra las camisetas perfectas para ti.
          </p>
          <Link href="/catalogo">
            <Button size="lg">Ver catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Carrito con items ─────────────────────────────────────────────────
  const shippingCost = 0; // envío gratis por ahora

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        Tu carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variant_id}>
              <CardContent className="flex gap-4">
                {/* Imagen */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {item.primary_image_url ? (
                    <Image
                      src={item.primary_image_url}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info y controles */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Talla: {item.variant_label}
                        {item.sku && (
                          <span className="ml-2 text-gray-400">
                            SKU: {item.sku}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatPrice(item.price_amount)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Control de cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Reducir cantidad"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-gray-900 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Subtotal y eliminar */}
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-700">
                        {formatPrice(item.price_amount * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(item.variant_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Eliminar del carrito"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Resumen del pedido
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium text-green-600">
                  {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatPrice(totalAmount + shippingCost)}
                </span>
              </div>

              <div className="pt-4 space-y-3">
                <Link href="/checkout">
                  <Button size="lg" className="w-full">
                    Continuar compra
                  </Button>
                </Link>
                <Link href="/catalogo">
                  <Button variant="outline" size="lg" className="w-full">
                    Seguir comprando
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
