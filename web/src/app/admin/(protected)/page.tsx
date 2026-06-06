import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
            <p className="text-sm text-gray-500">Gestiona tu catálogo</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">0</p>
            <p className="text-sm text-gray-500">productos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Pedidos</h3>
            <p className="text-sm text-gray-500">Ventas realizadas</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">0</p>
            <p className="text-sm text-gray-500">pedidos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Visitantes</h3>
            <p className="text-sm text-gray-500">Tráfico del sitio</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">0</p>
            <p className="text-sm text-gray-500">visitas hoy</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Bienvenido al Panel de Administración
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Desde aquí podrás gestionar tus productos, pedidos y clientes.
              Usa el menú lateral para navegar entre las diferentes secciones.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
