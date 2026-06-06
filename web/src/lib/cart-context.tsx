"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_slug: string;
  variant_id: string;
  product_name: string;
  variant_label: string;
  size: string;
  color: string | null;
  sku: string;
  price_amount: number;
  quantity: number;
  primary_image_url: string | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

// ─── Helpers de localStorage ─────────────────────────────────────────────────

const STORAGE_KEY = "plan2ship_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // si localStorage falla (e.g., quota exceeded), silenciar
  }
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Cargar del localStorage al montar (solo en cliente)
  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  // Persistir cada vez que cambian los items (despues del montaje inicial)
  useEffect(() => {
    if (mounted) {
      saveCart(items);
    }
  }, [items, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      if (existing) {
        return prev.map((i) =>
          i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(variantId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.variant_id === variantId ? { ...i, quantity } : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.price_amount * i.quantity, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalAmount,
      totalItems,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de un <CartProvider>");
  }
  return ctx;
}
