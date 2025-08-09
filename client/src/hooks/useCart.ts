import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sizeOption: string;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number, sizeOption: string) => void;
  updateQuantity: (productId: number, sizeOption: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.sizeOption === item.sizeOption
          );
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.sizeOption === item.sizeOption
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },
      
      removeItem: (productId, sizeOption) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.sizeOption === sizeOption)
          ),
        }));
      },
      
      updateQuantity: (productId, sizeOption, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.sizeOption === sizeOption
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ).filter((item) => item.quantity > 0),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'shopping-cart',
    }
  )
);