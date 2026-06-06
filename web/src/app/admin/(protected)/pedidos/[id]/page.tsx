"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { adminRequest } from "@/lib/api";
import { formatPrice } from "@/lib/format";

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
}

interface StatusHistory {
  id: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  fulfillment_type: string;
  shipping_address_json: Record<string, string> | null;
  pickup_notes: string | null;
  subtotal_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  payments: Payment[];
  status_history: StatusHistory[];
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

const STATUS_COLORS: Record<string, string> = {
  pendiente_pago: "bg-yellow-100 text-yellow-800",
  pagado: "bg-blue-100 text-blue-800",
  en_preparacion: "bg-purple-100 text-purple-800",
  listo_para_entrega: "bg-indigo-100 text-indigo-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
  reembolsado: "bg-gray-100 text-gray-800",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["en_preparacion", "cancelado", "reembolsado"],
  en_preparacion: ["listo_para_entrega"],
  listo_para_entrega: ["entregado"],
};

export default function AdminPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await adminRequest<{
          ok: boolean;
          data: OrderDetail;
        }>(`/admin/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el pedido."
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  async function handleTransition(newStatus: string) {
    setActionError(null);
    setIsTransitioning(true);
    try {
      await adminRequest(`/admin/orders/${id}/status-transitions`, {
        method: "POST",
        body: { new_status: newStatus },
      });

      const res = await adminRequest<{
        ok: boolean;
        data: OrderDetail;
      }>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al cambiar estado."
      );
    } finally {
      setIsTransitioning(false);
    }
  }

  async function handleConfirmPayment() {
    setActionError(null);
    setIsConfirmingPayment(true);
    try {
      await adminRequest(`/admin/orders/${id}/payments/manual-confirmation`, {
        method: "POST",
        body: {},
      });

      const res = await adminRequest<{
        ok: boolean;
        data: OrderDetail;
      }>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al confirmar pago."
      );
    } finally {
      setIsConfirmingPayment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Error al cargar pedido
        </h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Volver
          </Button>
          <Button size="sm" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const transitions = ALLOWED_TRANSITIONS[order.status] || [];
  const payment = order.payments[0];
  const isPendingPayment = order.status === "pendiente_pago";
  const isPaymentPending = !payment || payment.status !== "confirmado";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a pedidos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {order.order_number}
          </h1>
        </div>
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">
                Productos
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variante
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Cant.
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.variant_name}
                        <span className="block text-xs text-gray-400">
                          SKU: {item.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm text-gray-500">
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatPrice(order.subtotal_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatPrice(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">
                Historial de estados
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.status_history.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                          i === order.status_history.length - 1
                            ? "bg-indigo-500 ring-4 ring-indigo-100"
                            : "bg-gray-300"
                        }`}
                      />
                      {i < order.status_history.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">
                        {STATUS_LABELS[entry.new_status] || entry.new_status}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.created_at).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                ))}
                {order.status_history.length === 0 && (
                  <p className="text-sm text-gray-500">Sin historial registrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Cliente</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-900 font-medium">{order.customer_name}</p>
              <p className="text-gray-500">{order.customer_email}</p>
              <p className="text-gray-500">{order.customer_phone}</p>
            </CardContent>
          </Card>

          {order.fulfillment_type === "shipping" && order.shipping_address_json && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">
                  Dirección de envío
                </h3>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-500">
                <p>{order.shipping_address_json.street}</p>
                <p>
                  {order.shipping_address_json.city},{" "}
                  {order.shipping_address_json.state}{" "}
                  {order.shipping_address_json.zip_code}
                </p>
                <p>{order.shipping_address_json.country}</p>
              </CardContent>
            </Card>
          )}

          {order.fulfillment_type === "pickup" && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">
                  Datos de recogida
                </h3>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>{order.pickup_notes || "Sin notas de recogida."}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Pago</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment ? (
                <>
                  <div className="text-sm">
                    <p className="text-gray-500">
                      Método:{" "}
                      <span className="text-gray-900 font-medium">
                        {payment.method === "transferencia"
                          ? "Transferencia"
                          : payment.method}
                      </span>
                    </p>
                    <p className="text-gray-500">
                      Referencia:{" "}
                      <span className="text-gray-900">
                        {payment.reference || "—"}
                      </span>
                    </p>
                    <p className="text-gray-500">
                      Estado:{" "}
                      <span
                        className={
                          payment.status === "confirmado"
                            ? "text-green-600 font-medium"
                            : "text-yellow-600 font-medium"
                        }
                      >
                        {payment.status === "confirmado"
                          ? "Confirmado"
                          : "Pendiente"}
                      </span>
                    </p>
                    {payment.confirmed_at && (
                      <p className="text-gray-500 text-xs mt-1">
                        Confirmado:{" "}
                        {new Date(payment.confirmed_at).toLocaleString("es-MX")}
                      </p>
                    )}
                  </div>

                  {isPaymentPending && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      isLoading={isConfirmingPayment}
                      onClick={handleConfirmPayment}
                    >
                      Confirmar pago manual
                    </Button>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    No se ha registrado pago.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full"
                    isLoading={isConfirmingPayment}
                    onClick={handleConfirmPayment}
                  >
                    Registrar y confirmar pago
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {transitions.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">
                  Cambiar estado
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {transitions.map((newStatus) => (
                  <Button
                    key={newStatus}
                    size="sm"
                    variant={
                      newStatus === "cancelado" || newStatus === "reembolsado"
                        ? "danger"
                        : "outline"
                    }
                    className="w-full"
                    isLoading={isTransitioning}
                    onClick={() => handleTransition(newStatus)}
                  >
                    {STATUS_LABELS[newStatus] || newStatus}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Notas</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
