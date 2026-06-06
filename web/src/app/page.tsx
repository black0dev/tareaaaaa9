import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("v_active_products")
      .select("*")
      .limit(4);

    if (error) {
      console.error("Failed to fetch featured products:", error.message);
      return [];
    }

    return (data as Product[]) || [];
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Camisetas con
              <span className="block text-indigo-200">diseños únicos</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-indigo-100 leading-relaxed">
              Descubre nuestra colección de camisetas premium con los mejores
              diseños. Calidad excepcional, envíos rápidos y precios
              increíbles.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/catalogo">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 focus:ring-white">
                  Ver catálogo
                </Button>
              </Link>
              <Link href="#productos-destacados">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 focus:ring-white"
                >
                  Productos destacados
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="productos-destacados" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Productos Destacados
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Nuestros productos más populares, seleccionados especialmente
              para ti.
            </p>
          </div>

          {products.length === 0 ? (
            /* Empty state - no products in database */
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Estamos preparando nuestro catálogo. Vuelve pronto para
                descubrir nuestros productos.
              </p>
              <div className="mt-6">
                <Link href="/catalogo">
                  <Button variant="outline" size="sm">
                    Ir al catálogo
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Product grid with real data */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="group"
                >
                  <Card className="h-full transition-shadow duration-200 hover:shadow-md">
                    {/* Product image */}
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <CardContent>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="mt-2 text-lg font-bold text-indigo-600">
                        ${(product.price / 100).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Calidad Premium
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Camisetas 100% algodón con estampados de larga duración.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Envíos Rápidos
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Entrega en 24-48 horas a todo el país. Seguimiento en tiempo
                real.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pago Seguro
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Todas las transacciones están encriptadas y protegidas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
