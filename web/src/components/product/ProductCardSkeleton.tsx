export default function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Contenido skeleton */}
      <div className="p-4 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
