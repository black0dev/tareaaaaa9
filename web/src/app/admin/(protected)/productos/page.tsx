import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function AdminProductosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
      </div>

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
              Gestión de productos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              La administración de productos estará disponible en el Sprint 04.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
