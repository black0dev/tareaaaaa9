"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { adminRequest } from "@/lib/api";
import { formatPrice } from "@/lib/format";

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_status: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pago pendiente",
  confirmado: "Pago confirmado",
};

export default function AdminPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });

  const fetchOrders = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "20");
        if (statusFilter) params.set("status", statusFilter);

        const res = await adminRequest<{
          ok: boolean;
          data: OrderItem[];
          meta: PaginationMeta;
        }>(`/admin/orders?${params.toString()}`);

        setOrders(res.data || []);
        setPagination(
          res.meta || { total: 0, page: 1, page_size: 20, total_pages: 1 }
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar pedidos."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

      <Card className="mb-6">
        <CardContent className="py-3">
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="block rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchOrders(1)}
            >
              Filtrar
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
                onClick={() => fetchOrders(1)}
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
              <p className="mt-4 text-sm text-gray-500">Cargando pedidos...</p>
            </div>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No hay pedidos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter
                  ? "No hay pedidos con el filtro seleccionado."
                  : "Aún no se ha recibido ningún pedido."}
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
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Pago
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-indigo-600">
                        {order.order_number}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.payment_status === "confirmado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.payment_status === "confirmado"
                          ? "Confirmado"
                          : "Pendiente"}
                      </span>
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
                {Math.min(
                  pagination.page * pagination.page_size,
                  pagination.total
                )}{" "}
                de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
