"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CartToastProps {
  message: string;
  onClose: () => void;
}

export default function CartToast({ message, onClose }: CartToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animacion de entrada
    const showTimer = requestAnimationFrame(() => setVisible(true));

    // Auto-ocultar despues de 4 segundos
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // esperar animacion de salida
    }, 4000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="w-5 h-5 text-green-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium truncate">{message}</span>
        </div>
        <Link
          href="/carrito"
          className="flex-shrink-0 text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors whitespace-nowrap"
        >
          Ir al carrito
        </Link>
      </div>
    </div>
  );
}
