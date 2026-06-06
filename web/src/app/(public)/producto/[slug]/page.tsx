import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Detalle del Producto
        </h1>
        <p className="mt-2 text-gray-500">Slug: {slug}</p>
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Página de producto
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              La página de detalle del producto con toda la información
              estará disponible en el Sprint 02. Aquí podrás ver imágenes,
              descripción, tallas disponibles y precio.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link href="/catalogo">
                <Button variant="outline" size="sm">
                  Ver catálogo
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Inicio
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
