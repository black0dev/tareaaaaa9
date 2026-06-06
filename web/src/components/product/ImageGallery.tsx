"use client";

import { useState } from "react";

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const primaryImage =
    images.find((img) => img.is_primary) ?? images[0] ?? null;
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(
    primaryImage
  );

  // Si no hay imagenes, mostrar placeholder
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <svg
          className="w-20 h-20 text-gray-300"
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
    );
  }

  const currentImage = selectedImage ?? primaryImage;

  return (
    <div className="space-y-3">
      {/* Imagen principal */}
      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
        {currentImage && (
          <img
            src={currentImage.image_url}
            alt={currentImage.alt_text || "Imagen del producto"}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img) => {
            const isSelected = currentImage?.id === img.id;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  isSelected
                    ? "border-indigo-600 ring-1 ring-indigo-600"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || "Miniatura"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
