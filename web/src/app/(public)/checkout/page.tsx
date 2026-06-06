"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ShippingAddress {
  departamento: string;
  ciudad: string;
  direccion: string;
  referencia: string;
}

interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  departamento?: string;
  ciudad?: string;
  direccion?: string;
  form?: string;
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();

  // Estado del formulario (nombres en ingles para matchear con la API)
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<
    "shipping" | "pickup"
  >("shipping");
  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priceChangeErrors, setPriceChangeErrors] = useState<
    Array<{ variant_id: string; variant_name: string; sent_price: number; actual_price: number }> | null
  >(null);

  // Costo de envio
  const shippingCost = fulfillmentType === "shipping" ? 1500 : 0; // S/ 15.00
  const orderTotal = totalAmount + shippingCost;

  // ─── Validacion ─────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!customerName || customerName.trim().length < 2) {
      newErrors.customer_name = "Ingresa tu nombre completo (mínimo 2 caracteres)";
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.customer_email = "Ingresa un correo electrónico válido";
    }
    if (!customerPhone || customerPhone.trim().length < 7) {
      newErrors.customer_phone = "Ingresa un número de teléfono válido";
    }
    if (fulfillmentType === "shipping") {
      if (!departamento.trim()) newErrors.departamento = "Ingresa el departamento";
      if (!ciudad.trim()) newErrors.ciudad = "Ingresa la ciudad";
      if (!direccion.trim()) newErrors.direccion = "Ingresa la dirección";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerName, customerEmail, customerPhone, fulfillmentType, departamento, ciudad, direccion]);

  // ─── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setPriceChangeErrors(null);

    try {
      const payload: Record<string, unknown> = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        fulfillment_type: fulfillmentType,
        lines: items.map((item) => ({
          product_variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price_amount,
        })),
      };

      if (fulfillmentType === "shipping") {
        payload.shipping_address_json = {
          departamento: departamento.trim(),
          ciudad: ciudad.trim(),
          direccion: direccion.trim(),
          referencia: referencia.trim() || "",
        };
      } else {
        if (pickupNotes.trim()) {
          payload.pickup_notes = pickupNotes.trim();
        }
      }

      if (customerNotes.trim()) {
        payload.notes = customerNotes.trim();
      }

      const response = await fetch("/api/v1/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as {
          ok: boolean;
          error?: { code: string; message: string; details?: Record<string, unknown> };
        };

        if (errorData.error?.code === "stock_insufficient") {
          setSubmitError(
            errorData.error.message
          );
        } else if (errorData.error?.code === "price_changed") {
          const changes = (errorData.error.details?.changes as Array<{
            variant_id: string;
            variant_name: string;
            sent_price: number;
            actual_price: number;
          }>) || [];
          setPriceChangeErrors(changes);
          setSubmitError(
            "Uno o más precios cambiaron. Revisa las diferencias abajo y vuelve a intentar."
          );
        } else {
          setSubmitError(
            errorData.error?.message ||
              "Ocurrió un error al procesar el pedido. Intenta nuevamente."
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Pedido exitoso
      const successData = data as {
        ok: boolean;
        data: { order_id: string; order_number: string; status: string; total_amount: number };
      };

      // Guardar datos de confirmacion en sessionStorage para mostrarlos en la pagina de confirmacion
      sessionStorage.setItem(
        "last_order",
        JSON.stringify({
          order_number: successData.data.order_number,
          status: successData.data.status,
          total_amount: successData.data.total_amount,
          fulfillment_type: fulfillmentType,
          payment_method: "manual",
        })
      );

      // Limpiar carrito
      clearCart();

      // Redirigir a confirmacion
      router.push("/confirmacion");
    } catch {
      setSubmitError(
        "Error de conexión. Verifica tu internet e intenta nuevamente."
      );
      setIsSubmitting(false);
    }
  }, [
    validate,
    customerName,
    customerEmail,
    customerPhone,
    fulfillmentType,
    departamento,
    ciudad,
    direccion,
    referencia,
    pickupNotes,
    customerNotes,
    items,
    clearCart,
    router,
  ]);

  // ─── Si el carrito esta vacio, redirigir ──────────────────────────────

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Carrito vacío
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Agrega productos al carrito antes de continuar con la compra.
          </p>
          <Button onClick={() => router.push("/catalogo")} size="lg">
            Ver catálogo
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        Finalizar compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Datos de contacto
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nombre completo"
                type="text"
                placeholder="Ej. Juan Pérez"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customer_name)
                    setErrors((prev) => ({ ...prev, customer_name: undefined }));
                }}
                error={errors.customer_name}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="Ej. juan@email.com"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (errors.customer_email)
                      setErrors((prev) => ({ ...prev, customer_email: undefined }));
                  }}
                  error={errors.customer_email}
                  required
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="Ej. 987654321"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (errors.customer_phone)
                      setErrors((prev) => ({ ...prev, customer_phone: undefined }));
                  }}
                  error={errors.customer_phone}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Modalidad de entrega */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Modalidad de entrega
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fulfillment_type"
                    value="shipping"
                    checked={fulfillmentType === "shipping"}
                    onChange={() => setFulfillmentType("shipping")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Envío a domicilio
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fulfillment_type"
                    value="pickup"
                    checked={fulfillmentType === "pickup"}
                    onChange={() => setFulfillmentType("pickup")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Recojo en tienda
                  </span>
                </label>
              </div>

              {fulfillmentType === "shipping" && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Departamento"
                      type="text"
                      placeholder="Ej. Lima"
                      value={departamento}
                      onChange={(e) => {
                        setDepartamento(e.target.value);
                        if (errors.departamento)
                          setErrors((prev) => ({ ...prev, departamento: undefined }));
                      }}
                      error={errors.departamento}
                      required
                    />
                    <Input
                      label="Ciudad"
                      type="text"
                      placeholder="Ej. Lima"
                      value={ciudad}
                      onChange={(e) => {
                        setCiudad(e.target.value);
                        if (errors.ciudad)
                          setErrors((prev) => ({ ...prev, ciudad: undefined }));
                      }}
                      error={errors.ciudad}
                      required
                    />
                  </div>
                  <Input
                    label="Dirección"
                    type="text"
                    placeholder="Ej. Av. Principal 123, Dpto 4B"
                    value={direccion}
                    onChange={(e) => {
                      setDireccion(e.target.value);
                      if (errors.direccion)
                        setErrors((prev) => ({ ...prev, direccion: undefined }));
                    }}
                    error={errors.direccion}
                    required
                  />
                  <Input
                    label="Referencia (opcional)"
                    type="text"
                    placeholder="Ej. Al costado del grifo"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>
              )}

              {fulfillmentType === "pickup" && (
                <div className="pt-2">
                  <Input
                    label="Notas para el recojo (opcional)"
                    type="text"
                    placeholder="Ej. Recogeré el pedido el lunes por la tarde"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metodo de pago */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Método de pago
              </h2>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value="manual"
                  checked
                  readOnly
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Transferencia / Pago manual
                </span>
              </label>
              <p className="mt-2 text-xs text-gray-500 ml-6">
                Recibirás las instrucciones de pago después de confirmar el
                pedido.
              </p>
            </CardContent>
          </Card>

          {/* Notas adicionales */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Notas adicionales
              </h2>
            </CardHeader>
            <CardContent>
              <Input
                label="Notas para tu pedido (opcional)"
                type="text"
                placeholder="Ej. Quiero la talla M si está disponible"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Errores de submit */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">{submitError}</p>

              {/* Detalle de cambios de precio */}
              {priceChangeErrors && priceChangeErrors.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {priceChangeErrors.map((change) => (
                    <li
                      key={change.variant_id}
                      className="text-sm text-red-700 bg-red-100 rounded p-2"
                    >
                      <span className="font-medium">{change.variant_name}</span>
                      : el precio cambió de{" "}
                      <span className="line-through">
                        {formatPrice(change.sent_price)}
                      </span>{" "}
                      a{" "}
                      <span className="font-semibold">
                        {formatPrice(change.actual_price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {priceChangeErrors && (
                <p className="text-sm text-red-700 mt-2">
                  Por favor, regresa al carrito para ver los precios actualizados
                  antes de continuar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Resumen del pedido (sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Resumen del pedido
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.variant_id} className="flex gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {item.primary_image_url ? (
                          <Image
                            src={item.primary_image_url}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[8px]">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.variant_label} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-gray-900 flex-shrink-0">
                        {formatPrice(item.price_amount * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">S/ 0.00</span>
                      ) : (
                        <span className="text-gray-900">
                          {formatPrice(shippingCost)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : "Confirmar pedido"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
