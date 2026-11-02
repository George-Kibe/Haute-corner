import { dbConnect } from '@/lib/db';
import { notFound, ok, PUBLIC_CACHE, route } from '@/lib/http';
import { serializeProduct } from '@/lib/serializers';
import { isObjectId } from '@/lib/validation';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';

export const GET = route<RouteContext<'/api/v1/products/[id]'>>(async (_request, { params }) => {
  const { id } = await params;
  if (!isObjectId(id)) throw notFound();

  await dbConnect();
  const product = await Product.findOne({ _id: id, status: 'active' }).lean();
  if (!product) throw notFound();

  const seller = await Seller.findOne({ _id: product.sellerId, status: 'approved' }).lean();
  if (!seller) throw notFound();

  return ok(serializeProduct(product, seller), { cache: PUBLIC_CACHE });
});
