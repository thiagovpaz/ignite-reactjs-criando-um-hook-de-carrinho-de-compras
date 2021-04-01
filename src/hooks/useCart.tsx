import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      const responseStock = await api.get(`/stock/${productId}`);
      
      const cartProduct= cart.find(product => product.id === productId);
      const stockAmount = responseStock.data.amount;
      const cartProductAmount = cartProduct ? cartProduct.amount : 0;
      const amount = cartProductAmount + 1;

      if( amount >  stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(cartProduct) {
        cartProduct.amount = amount;

      } else {
        const responseProduct = await api.get<Product>(`products/${productId}`);

        const newProduct = {...responseProduct.data, amount: 1 };
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct =  (productId: number) => {
    try {
      const updatedCart = cart.filter(p => p.id !== productId);

      if(!cart.find(p => p.id === productId)) {
        toast.error('Erro na remoção do produto');
        return;
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`);

      const cartProduct = cart.find(product => product.id === productId);
      const cartProductAmmout = amount;

      if(cartProductAmmout > responseStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(cartProduct && amount > 0) {

      cartProduct.amount = cartProductAmmout;

        const updatedCart = cart.map((p) => {
          if(p.id === cartProduct.id) {
            return cartProduct;
          }
          return p;
        });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
