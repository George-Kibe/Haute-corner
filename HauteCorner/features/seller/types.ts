import type { Audience, Product, ProductType } from '@/features/products/types';

export type SellerStatus = 'applied' | 'approved' | 'rejected' | 'suspended';
export type DocumentKind = 'national_id' | 'passport' | 'business_registration' | 'kra_pin' | 'other';

// The signed-in user's own shop, from GET /seller/application.
export type OwnSeller = {
  id: string;
  status: SellerStatus;
  businessName: string;
  phone: string;
  payoutMpesaNumber: string;
  payoutNumberUnderReview: boolean;
  deliveryFee: number;
  deliveryAreas: string;
  returnsNote: string | null;
  documents: { kind: DocumentKind }[];
  reviewReason: string | null;
  createdAt: string;
};

export type ShopFields = {
  businessName: string;
  phone: string;
  payoutMpesaNumber: string;
  deliveryFee: number;
  deliveryAreas: string;
  returnsNote?: string;
};

export type Application = ShopFields & { documents: { kind: DocumentKind; publicId: string }[] };

export type ProductStatus = 'active' | 'archived' | 'removed' | 'hidden';

export type OwnProduct = Omit<Product, 'status'> & { status: ProductStatus; removedReason: string | null };

export type ListingFields = {
  title: string;
  description: string;
  type: ProductType;
  audience: Audience;
  price: number;
  stock: number;
  options: string[];
  media: { kind: 'image' | 'video'; publicId: string }[];
};

export type UploadKind = 'image' | 'video' | 'document';

export type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  signature: string;
  params: Record<string, string | number>;
};
