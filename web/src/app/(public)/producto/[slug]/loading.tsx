export default function ProductoDetalleLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 h-4 bg-gray-200 rounded w-48" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Imagen skeleton */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>

          {/* Variant selector skeleton */}
          <div className="border-t border-gray-200 pt-6 mt-8 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Button skeleton */}
          <div className="mt-6 space-y-3">
            <div className="h-12 bg-gray-200 rounded-lg w-full" />
            <div className="h-12 bg-gray-200 rounded-lg w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
