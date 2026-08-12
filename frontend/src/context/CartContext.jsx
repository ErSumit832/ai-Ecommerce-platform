import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cartApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart({ items: [], subtotal: 0, item_count: 0 });
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(productId, quantity = 1) {
    const { data } = await cartApi.add({ product_id: productId, quantity });
    setCart(data);
  }

  async function updateItem(itemId, quantity) {
    const { data } = await cartApi.update(itemId, { quantity });
    setCart(data);
  }

  async function removeItem(itemId) {
    const { data } = await cartApi.remove(itemId);
    setCart(data);
  }

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
