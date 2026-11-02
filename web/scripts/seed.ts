// Creates sample sellers and products for development. Run with: bun run seed
import mongoose, { Types } from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Product, type ProductAttributes } from '@/models/Product';
import { Seller, type SellerAttributes } from '@/models/Seller';

type SampleSeller = Pick<SellerAttributes, 'businessName' | 'deliveryFee' | 'deliveryAreas'> &
  Partial<Pick<SellerAttributes, 'returnsNote'>>;
type SampleProduct = Pick<
  ProductAttributes,
  'title' | 'description' | 'type' | 'audience' | 'price' | 'media' | 'options' | 'stock'
>;

const image = (publicId: string) => [{ kind: 'image' as const, publicId }];
const shoeSizes = ['38', '39', '40', '41', '42', '43'];
const clothingSizes = ['S', 'M', 'L', 'XL'];

const catalogue: { seller: SampleSeller; products: SampleProduct[] }[] = [
  {
    seller: {
      businessName: 'Nairobi Soles',
      deliveryFee: 250,
      deliveryAreas: 'Nairobi and Kiambu',
      returnsNote: 'Unworn shoes within 7 days',
    },
    products: [
      {
        title: 'Purple running shoes',
        description: 'Lightweight mesh trainers with a cushioned sole, made for daily runs and long days out.',
        type: 'shoes',
        audience: 'women',
        price: 5200,
        media: image('shoes'),
        options: shoeSizes.slice(0, 4),
        stock: 14,
      },
      {
        title: 'Retro air trainers',
        description: 'A retro silhouette in cream and tan with a visible air sole. Comfortable from the first wear.',
        type: 'shoes',
        audience: 'unisex',
        price: 7900,
        media: image('samples/shoe'),
        options: shoeSizes,
        stock: 6,
      },
      {
        title: 'Black mesh runners',
        description: 'Breathable black running shoes with a flexible sole for the road or the gym.',
        type: 'shoes',
        audience: 'men',
        price: 6400,
        media: image('docs/shoes'),
        options: shoeSizes.slice(2),
        stock: 9,
      },
      {
        title: 'Blue canvas sneakers',
        description: 'Everyday low-top sneakers in washed blue canvas, with a clean white sole.',
        type: 'shoes',
        audience: 'unisex',
        price: 2800,
        media: image('sneakers'),
        options: shoeSizes,
        stock: 22,
      },
    ],
  },
  {
    seller: {
      businessName: 'Kilimani Threads',
      deliveryFee: 200,
      deliveryAreas: 'Nairobi',
      returnsNote: 'Unworn items with tags within 5 days',
    },
    products: [
      {
        title: 'Royal blue evening dress',
        description: 'A flowing royal blue dress with a fitted waist and soft pleats, made for special occasions.',
        type: 'clothing',
        audience: 'women',
        price: 6500,
        media: image('dress'),
        options: clothingSizes,
        stock: 4,
      },
      {
        title: 'Sky blue cotton tee',
        description: 'A soft, breathable cotton T-shirt in a relaxed fit. An everyday essential.',
        type: 'clothing',
        audience: 'unisex',
        price: 1200,
        media: image('tshirt'),
        options: clothingSizes,
        stock: 40,
      },
      {
        title: 'Kids sky blue tee',
        description: 'Our soft cotton tee in sizes for children. Easy to wash and comfortable to play in.',
        type: 'clothing',
        audience: 'children',
        price: 800,
        media: image('tshirt'),
        options: ['4-6', '7-9', '10-12'],
        stock: 18,
      },
      {
        title: 'Lilac pullover hoodie',
        description: 'A heavyweight lilac hoodie with a roomy hood and a relaxed fit for cooler evenings.',
        type: 'clothing',
        audience: 'men',
        price: 3400,
        media: image('samples/man-portrait'),
        options: clothingSizes,
        stock: 11,
      },
    ],
  },
  {
    seller: {
      businessName: 'Westlands Denim Co.',
      deliveryFee: 300,
      deliveryAreas: 'Nairobi, Thika and Nakuru',
    },
    products: [
      {
        title: 'Light wash denim jacket',
        description: 'A classic light wash denim jacket with a slightly cropped cut. Goes with everything.',
        type: 'clothing',
        audience: 'women',
        price: 4600,
        media: image('model'),
        options: clothingSizes,
        stock: 8,
      },
      {
        title: 'Oversized denim jacket',
        description: 'An easy oversized jacket in mid-wash denim, for layering over any outfit.',
        type: 'clothing',
        audience: 'women',
        price: 4900,
        media: image('docs/model'),
        options: clothingSizes,
        stock: 0,
      },
      {
        title: 'Graphic tee and joggers set',
        description: 'A matching relaxed tee and tapered joggers. Comfortable enough for the whole weekend.',
        type: 'clothing',
        audience: 'women',
        price: 3800,
        media: image('samples/woman-on-a-football-field'),
        options: clothingSizes,
        stock: 12,
      },
    ],
  },
];

async function main() {
  const { connection } = await dbConnect();
  const databaseName = connection.db!.databaseName;

  if (!databaseName.endsWith('_dev')) {
    throw new Error(`Refusing to seed "${databaseName}". Seeding only runs on a database ending in _dev.`);
  }

  await Promise.all([Product.init(), Seller.init()]);
  await Promise.all([Product.deleteMany({}), Seller.deleteMany({})]);

  for (const { seller, products } of catalogue) {
    const created = await Seller.create({
      ...seller,
      userId: new Types.ObjectId(),
      status: 'approved',
      phone: '+254700000000',
      payoutMpesaNumber: '+254700000000',
    });
    await Product.create(products.map((product) => ({ ...product, sellerId: created._id })));
  }

  console.log(`Seeded ${await Seller.countDocuments()} sellers and ${await Product.countDocuments()} products into ${databaseName}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
