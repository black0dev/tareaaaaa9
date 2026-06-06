"use client";

import { useState, useMemo } from "react";

export interface VariantOption {
  id: string;
  size: string;
  color: string | null;
  price_amount: number;
  stock_quantity: number;
  sku: string;
}

interface VariantSelectorProps {
  variants: VariantOption[];
  onSelect: (variant: VariantOption | null) => void;
}

export default function VariantSelector({
  variants,
  onSelect,
}: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Tallas unicas ordenadas
  const sizes = useMemo(() => {
    const unique = [...new Set(variants.map((v) => v.size))];
    return unique.sort();
  }, [variants]);

  // Colores unicos (filtramos null)
  const colors = useMemo(() => {
    const unique = [
      ...new Set(variants.map((v) => v.color).filter(Boolean)),
    ] as string[];
    return unique.sort();
  }, [variants]);

  // Determinar si hay colores para mostrar
  const hasColors = colors.length > 1;

  // Tallas disponibles segun el color seleccionado
  const availableSizes = useMemo(() => {
    if (!hasColors || !selectedColor) {
      return new Set(sizes);
    }
    return new Set(
      variants
        .filter((v) => v.color === selectedColor)
        .map((v) => v.size)
    );
  }, [hasColors, selectedColor, sizes, variants]);

  // Colores disponibles segun la talla seleccionada
  const availableColors = useMemo(() => {
    if (!selectedSize) {
      return new Set(colors);
    }
    return new Set(
      variants
        .filter((v) => v.size === selectedSize && v.color)
        .map((v) => v.color as string)
    );
  }, [selectedSize, colors, variants]);

  // Variante seleccionada actual
  const selectedVariant = useMemo(() => {
    if (!selectedSize) return null;
    if (hasColors && !selectedColor) return null;

    return (
      variants.find((v) => {
        if (hasColors) {
          return v.size === selectedSize && v.color === selectedColor;
        }
        return v.size === selectedSize;
      }) ?? null
    );
  }, [selectedSize, selectedColor, hasColors, variants]);

  // Notificar al padre cuando cambia la seleccion
  const updateSelection = (size: string | null, color: string | null) => {
    setSelectedSize(size);
    setSelectedColor(color);

    if (!size) {
      onSelect(null);
      return;
    }
    if (hasColors && !color) {
      onSelect(null);
      return;
    }

    const match = variants.find((v) => {
      if (hasColors) {
        return v.size === size && v.color === color;
      }
      return v.size === size;
    });
    onSelect(match ?? null);
  };

  const handleSizeClick = (size: string) => {
    if (selectedSize === size) {
      // Deseleccionar
      updateSelection(null, selectedColor);
      return;
    }
    // Si el color actual no esta disponible para esta talla, resetear color
    const newColor =
      selectedColor && availableColors.has(selectedColor)
        ? selectedColor
        : null;
    updateSelection(size, newColor);
  };

  const handleColorClick = (color: string) => {
    if (selectedColor === color) {
      updateSelection(selectedSize, null);
      return;
    }
    updateSelection(selectedSize, color);
  };

  return (
    <div className="space-y-4">
      {/* Selector de talla */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Talla
        </label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const isAvailable = availableSizes.has(size);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleSizeClick(size)}
                className={`min-w-[3rem] px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                  ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : isAvailable
                        ? "bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                        : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                  }
                `}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de color (solo si hay mas de 1 color) */}
      {hasColors && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isAvailable = availableColors.has(color);
              const isSelected = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleColorClick(color)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                    ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : isAvailable
                          ? "bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                          : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                    }
                  `}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Informacion del stock de la variante seleccionada */}
      {selectedVariant && (
        <p className="text-sm text-gray-600">
          {selectedVariant.stock_quantity > 0
            ? `Quedan ${selectedVariant.stock_quantity} unidades`
            : "Agotado"}
        </p>
      )}
    </div>
  );
}
