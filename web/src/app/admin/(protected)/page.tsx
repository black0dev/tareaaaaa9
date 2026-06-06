"use client";

import { useState, useEffect } from "react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  activeProducts: number;
  pendingOrders: number;
  ordersToday: number;
  lowStock: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProducts: 0,
    pendingOrders: 0,
    ordersToday: 0,
    lowStock: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: activeProducts },
          { count: pendingOrders },
          { count: ordersToday },
          { count: lowStock },
        ] = await Promise.all([
          supabase
            .from("v_active_products")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendiente_pago"),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .gte("created_at", new Date().toISOString().split("T")[0]),
          supabase
            .from("product_variants")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true)
            .lt("stock_quantity", 5),
        ]);

        setStats({
          activeProducts: activeProducts || 0,
          pendingOrders: pendingOrders || 0,
          ordersToday: ordersToday || 0,
          lowStock: lowStock || 0,
        });
      } catch {
        // Stats remain at 0 on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Productos activos",
      description: "En catálogo",
      value: stats.activeProducts,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: "Pedidos pendientes",
      description: "Por confirmar pago",
      value: stats.pendingOrders,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Pedidos hoy",
      description: "Recibidos",
      value: stats.ordersToday,
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      title: "Stock bajo",
      description: "Menos de 5 unidades",
      value: stats.lowStock,
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <span className={card.color}>{card.icon}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Panel de Administración
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Desde aquí puedes gestionar tus productos, pedidos y clientes.
              Usa el menú lateral para navegar entre las diferentes secciones.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
