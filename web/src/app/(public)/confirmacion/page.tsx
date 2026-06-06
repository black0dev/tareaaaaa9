"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { formatPrice } from "@/lib/format";
import { STORE_CONFIG } from "@/lib/config";

interface LastOrder {
  order_number: string;
  status: string;
  total_amount: number;
  fulfillment_type: "shipping" | "pickup";
  payment_method: string;
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

export default function ConfirmacionPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      if (raw) {
        setOrder(JSON.parse(raw));
      }
    } catch {
      // ignorar
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Sin datos de orden ────────────────────────────────────────────────

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
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
            No hay pedido reciente
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            No encontramos informacion de un pedido reciente. Si acabas de
            realizar uno, verifica tu correo electronico para los detalles.
          </p>
          <Link href="/">
            <Button size="lg">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Orden confirmada ──────────────────────────────────────────────────

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const isPendingPayment = order.status === "pendiente_pago";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      {/* Icono de exito */}
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          ¡Pedido confirmado!
        </h1>
        <p className="text-gray-500">
          Hemos recibido tu pedido y pronto lo procesaremos.
        </p>
      </div>

      {/* Detalles del pedido */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Detalles del pedido
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Número de pedido</span>
            <span className="font-mono font-medium text-gray-900">
              {order.order_number}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estado</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                isPendingPayment
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Modalidad</span>
            <span className="text-gray-900">
              {order.fulfillment_type === "shipping"
                ? "Envío a domicilio"
                : "Recojo en tienda"}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-indigo-600">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones de pago */}
      {isPendingPayment && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Instrucciones de pago
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            {STORE_CONFIG.payment.method === "manual" ? (
              <>
                <p>
                  Realiza tu transferencia a la cuenta:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p>
                    <span className="font-medium">Banco:</span>{" "}
                    {STORE_CONFIG.payment.bankName}
                  </p>
                  <p>
                    <span className="font-medium">Cuenta:</span>{" "}
                    {STORE_CONFIG.payment.accountNumber}
                  </p>
                  <p>
                    <span className="font-medium">Titular:</span>{" "}
                    {STORE_CONFIG.payment.accountHolder}
                  </p>
                  <p>
                    <span className="font-medium">Monto exacto:</span>{" "}
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
                <p>
                  Envía el comprobante a:{" "}
                  <a
                    href={`mailto:${STORE_CONFIG.payment.contactEmail}`}
                    className="text-indigo-600 hover:text-indigo-800 underline"
                  >
                    {STORE_CONFIG.payment.contactEmail}
                  </a>{" "}
                  o al WhatsApp{" "}
                  <a
                    href={`https://wa.me/${STORE_CONFIG.payment.contactPhone.replace(/\D/g, "")}`}
                    className="text-indigo-600 hover:text-indigo-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {STORE_CONFIG.payment.contactPhone}
                  </a>
                </p>
                <p className="text-gray-500">
                  Tu pedido será confirmado cuando validemos el pago.
                </p>
              </>
            ) : (
              <>
                <p>Pago simulado - tu pedido está confirmado.</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrucciones de entrega */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            {order.fulfillment_type === "shipping"
              ? "Información de envío"
              : "Información de recojo"}
          </h2>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          {order.fulfillment_type === "shipping" ? (
            <div className="space-y-2">
              <p>
                Tu pedido será enviado a la dirección proporcionada.
              </p>
              <p>
                El tiempo estimado de entrega es de{" "}
                <span className="font-medium">3 a 5 días hábiles</span> después
                de la confirmación del pago.
              </p>
              <p>
                Recibirás actualizaciones del estado de tu pedido por correo
                electrónico.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                Te esperamos en nuestra tienda para recoger tu pedido.
              </p>
              <p>
                <span className="font-medium">Dirección:</span> Av. Comercio
                123, Miraflores, Lima
              </p>
              <p>
                <span className="font-medium">Horario:</span> Lunes a Sábado de
                10:00 a.m. a 7:00 p.m.
              </p>
              <p>
                Presenta tu número de pedido al momento del recojo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boton volver al inicio */}
      <div className="text-center">
        <Link href="/">
          <Button size="lg">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
