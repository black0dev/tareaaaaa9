import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function CatalogoLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
      {/* Header skeleton */}
      <div className="text-center mb-8 animate-pulse">
        <div className="h-9 sm:h-10 bg-gray-200 rounded w-40 mx-auto mb-2" />
        <div className="h-5 bg-gray-200 rounded w-56 mx-auto" />
      </div>

      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-pulse">
        <div className="flex-1 h-11 bg-gray-200 rounded-lg" />
        <div className="w-full sm:w-48 h-11 bg-gray-200 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
