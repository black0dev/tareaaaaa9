import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "Catálogo - Tienda Camisetas",
  description: "Explora nuestra colección de camisetas con diseños exclusivos.",
};

export default function CatalogoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Catálogo
        </h1>
      </div>

      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Catálogo disponible próximamente
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Estamos preparando la experiencia de catálogo completa con
              filtros, búsqueda y paginación. Esta funcionalidad estará
              disponible en el Sprint 02.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
