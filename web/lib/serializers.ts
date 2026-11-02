import type { Types } from 'mongoose';
import type { ProductAttributes } from '@/models/Product';
import type { SellerAttributes } from '@/models/Seller';

type WithId<T> = T & { _id: Types.ObjectId };

// Sellers are public here, so only ever pick fields a shopper may see. Phone,
// payout number and documents must never appear in these responses.
export function serializeSellerSummary(seller: WithId<SellerAttributes>) {
  return {
    id: String(seller._id),
    name: seller.businessName,
    deliveryFee: seller.deliveryFee,
  };
}

export function serializeSeller(seller: WithId<SellerAttributes>) {
  return {
    ...serializeSellerSummary(seller),
    deliveryAreas: seller.deliveryAreas,
    returnsNote: seller.returnsNote ?? null,
  };
}

export function serializeProduct(product: WithId<ProductAttributes>, seller: WithId<SellerAttributes>) {
  return {
    id: String(product._id),
    title: product.title,
    description: product.description,
    type: product.type,
    audience: product.audience,
    price: product.price,
    currency: 'KES',
    media: product.media,
    options: product.options,
    stock: product.stock,
    status: product.status,
    seller: serializeSellerSummary(seller),
    createdAt: product.createdAt.toISOString(),
  };
}
