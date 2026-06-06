import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Tienda Camisetas
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Catálogo
            </Link>
          </nav>

          <div className="sm:hidden">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-indigo-600"
            >
              Catálogo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
