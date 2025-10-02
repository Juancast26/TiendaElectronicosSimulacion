export type Product = {
    id: string;
    name: string;
    price: number;
  };
  
  export type Order = {
    id: string;
    productId: string;
    productName: string;
    price: number;
    createdAt: string;
  };
  