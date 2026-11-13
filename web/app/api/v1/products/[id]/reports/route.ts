import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ApiError, notFound, ok, parseBody, route } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { isObjectId } from '@/lib/validation';
import { Product } from '@/models/Product';
import { Report } from '@/models/Report';
import { Seller } from '@/models/Seller';
import { reportBody } from '@/schemas/reports';

// Reports a listing for an admin to review. Reporting the same listing again
// while the first report is open changes nothing.
export const POST = route<RouteContext<'/api/v1/products/[id]/reports'>>(async (request, { params }) => {
  const { id } = await params;
  await dbConnect();
  const user = await requireUser(request);
  const body = await parseBody(reportBody, request);
  if (!isObjectId(id)) throw notFound();

  const product = await Product.findOne({ _id: id, status: 'active' }).lean();
  if (!product) throw notFound();
  const ownShop = await Seller.exists({ _id: product.sellerId, userId: user._id });
  if (ownShop) throw new ApiError(409, 'conflict', 'You cannot report your own listing');

  await rateLimit('reports:user', String(user._id), LIMITS.reportsPerUser);
  try {
    await Report.create({ productId: product._id, sellerId: product.sellerId, reporterId: user._id, ...body });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  return ok({ received: true }, { status: 202 });
});
