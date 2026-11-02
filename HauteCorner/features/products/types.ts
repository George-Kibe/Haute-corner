export type ProductType = 'shoes' | 'clothing';
export type Audience = 'men' | 'women' | 'children' | 'unisex';

export type ProductMedia = {
  kind: 'image' | 'video';
  publicId: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  audience: Audience;
  price: number;
  currency: 'KES';
  media: ProductMedia[];
  options: string[];
  stock: number;
  status: string;
  seller: {
    id: string;
    name: string;
    deliveryFee: number;
  };
  createdAt: string;
};

export type ProductFilters = {
  type?: ProductType;
  audience?: Audience;
  q?: string;
};

export function firstImage(product: Product) {
  return product.media.find((item) => item.kind === 'image');
}
