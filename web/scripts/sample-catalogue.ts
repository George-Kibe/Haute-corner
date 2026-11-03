// Sample sellers and products for testing. Not real listings.
// Photos are Cloudinary's own sample images, copied into hautecorner/samples/
// in our account so that they can be removed together with remove-samples.
import type { ProductAttributes } from '@/models/Product';
import type { SellerAttributes } from '@/models/Seller';

export const SAMPLE_FOLDER = 'hautecorner/samples';
export const SAMPLE_TAG = 'hautecorner-sample';

// Where each photo is copied from: our account's default samples, or Cloudinary's public demo account.
const own = (publicId: string) => ({ cloud: 'own' as const, publicId });
const demo = (publicId: string) => ({ cloud: 'demo' as const, publicId });

export const SAMPLE_IMAGES = {
  'purple-running-shoes': own('samples/ecommerce/shoes'),
  'retro-trainers': own('samples/shoe'),
  'white-court-sneakers': own('cld-sample-5'),
  'black-mesh-runners': demo('docs/shoes'),
  'blue-canvas-sneakers': demo('sneakers'),
  'tan-suit': own('samples/man-on-a-street'),
  'rust-crew-tee': demo('jeans'),
  'leaf-print-shirt': own('samples/smile'),
  'grey-hoodie': own('samples/people/smiling-man'),
  'kids-winter-jacket': own('samples/people/boy-snow-hoodie'),
  'royal-blue-dress': demo('dress'),
  'sky-blue-tee': demo('tshirt'),
  'lilac-hoodie': own('samples/man-portrait'),
  'coral-knit-jumper': own('cld-sample'),
  'turquoise-turtleneck': demo('docs/blue_sweater'),
  'ribbed-turtlenecks': own('samples/two-ladies'),
  'leather-biker-jacket': own('samples/look-up'),
  'denim-jacket-street': demo('docs/model'),
  'denim-jacket-light': demo('model'),
  'tee-and-joggers': own('samples/woman-on-a-football-field'),
} as const;

export type SampleImage = keyof typeof SAMPLE_IMAGES;

export type SampleSeller = Pick<SellerAttributes, 'businessName' | 'deliveryFee' | 'deliveryAreas'> &
  Partial<Pick<SellerAttributes, 'returnsNote'>>;

export type SampleProduct = Pick<
  ProductAttributes,
  'title' | 'description' | 'type' | 'audience' | 'price' | 'options' | 'stock'
> & { images: SampleImage[] };

const shoeSizes = ['38', '39', '40', '41', '42', '43'];
const clothingSizes = ['S', 'M', 'L', 'XL'];
const kidsSizes = ['4-6', '7-9', '10-12'];

// Created in this order, and lists show the newest first, so the last product appears first on Home.
// The Maestro flows in HauteCorner/.maestro/ depend on some of these names.
export const SAMPLE_CATALOGUE: { seller: SampleSeller; products: SampleProduct[] }[] = [
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
        images: ['purple-running-shoes'],
        options: shoeSizes.slice(0, 4),
        stock: 14,
      },
      {
        title: 'Retro air trainers',
        description: 'A retro silhouette in cream and tan with a visible air sole. Comfortable from the first wear.',
        type: 'shoes',
        audience: 'unisex',
        price: 7900,
        images: ['retro-trainers'],
        options: shoeSizes,
        stock: 6,
      },
      {
        title: 'White leather court sneakers',
        description: 'Clean white low-tops in smooth leather, with a padded collar and a grippy rubber sole.',
        type: 'shoes',
        audience: 'women',
        price: 4500,
        images: ['white-court-sneakers'],
        options: shoeSizes.slice(0, 5),
        stock: 10,
      },
      {
        title: 'Black mesh runners',
        description: 'Breathable black running shoes with a flexible sole for the road or the gym.',
        type: 'shoes',
        audience: 'men',
        price: 6400,
        images: ['black-mesh-runners'],
        options: [...shoeSizes.slice(2), '44', '45'],
        stock: 9,
      },
      {
        title: 'Blue canvas sneakers',
        description: 'Everyday low-top sneakers in washed blue canvas, with a clean white sole.',
        type: 'shoes',
        audience: 'unisex',
        price: 2800,
        images: ['blue-canvas-sneakers'],
        options: shoeSizes,
        stock: 22,
      },
    ],
  },
  {
    seller: {
      businessName: 'Kenyatta Avenue Tailors',
      deliveryFee: 350,
      deliveryAreas: 'Nairobi, Mombasa and Kisumu',
      returnsNote: 'Free alterations within 14 days',
    },
    products: [
      {
        title: 'Tan two-piece suit',
        description: 'A tailored suit in warm tan, with a single-breasted jacket and slim trousers.',
        type: 'clothing',
        audience: 'men',
        price: 14500,
        images: ['tan-suit'],
        options: ['46', '48', '50', '52'],
        stock: 3,
      },
      {
        title: 'Rust long-sleeve crew tee',
        description: 'A soft long-sleeve tee in a deep rust colour, with a ribbed crew neck.',
        type: 'clothing',
        audience: 'men',
        price: 1800,
        images: ['rust-crew-tee'],
        options: clothingSizes,
        stock: 25,
      },
      {
        title: 'Leaf print short-sleeve shirt',
        description: 'A relaxed button-up shirt with an all-over leaf print, cut for warm days.',
        type: 'clothing',
        audience: 'men',
        price: 2600,
        images: ['leaf-print-shirt'],
        options: clothingSizes,
        stock: 7,
      },
      {
        title: 'Grey zip hoodie',
        description: 'A mid-weight grey hoodie with a full zip and front pockets. Layers over anything.',
        type: 'clothing',
        audience: 'men',
        price: 3200,
        images: ['grey-hoodie'],
        options: clothingSizes,
        stock: 15,
      },
      {
        title: 'Kids winter hooded jacket',
        description: 'A warm padded jacket with a fleece-lined hood, for cold mornings and rainy days.',
        type: 'clothing',
        audience: 'children',
        price: 3900,
        images: ['kids-winter-jacket'],
        options: kidsSizes,
        stock: 5,
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
        images: ['royal-blue-dress'],
        options: clothingSizes,
        stock: 4,
      },
      {
        title: 'Sky blue cotton tee',
        description: 'A soft, breathable cotton T-shirt in a relaxed fit. An everyday essential.',
        type: 'clothing',
        audience: 'unisex',
        price: 1200,
        images: ['sky-blue-tee'],
        options: clothingSizes,
        stock: 40,
      },
      {
        title: 'Kids sky blue tee',
        description: 'Our soft cotton tee in sizes for children. Easy to wash and comfortable to play in.',
        type: 'clothing',
        audience: 'children',
        price: 800,
        images: ['sky-blue-tee'],
        options: kidsSizes,
        stock: 18,
      },
      {
        title: 'Lilac pullover hoodie',
        description: 'A heavyweight lilac hoodie with a roomy hood and a relaxed fit for cooler evenings.',
        type: 'clothing',
        audience: 'men',
        price: 3400,
        images: ['lilac-hoodie'],
        options: clothingSizes,
        stock: 11,
      },
      {
        title: 'Coral knit jumper',
        description: 'A cosy coral jumper in a chunky rib knit, with dropped shoulders and a relaxed fit.',
        type: 'clothing',
        audience: 'women',
        price: 3600,
        images: ['coral-knit-jumper'],
        options: clothingSizes,
        stock: 9,
      },
      {
        title: 'Turquoise knit turtleneck',
        description: 'A soft turquoise turtleneck in a loose knit. Warm without being heavy.',
        type: 'clothing',
        audience: 'women',
        price: 4200,
        images: ['turquoise-turtleneck'],
        options: clothingSizes,
        stock: 6,
      },
      {
        title: 'Ribbed turtleneck top',
        description: 'A fitted ribbed turtleneck, shown in mustard and black. Easy to dress up or down.',
        type: 'clothing',
        audience: 'women',
        price: 2900,
        images: ['ribbed-turtlenecks'],
        options: clothingSizes,
        stock: 20,
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
        title: 'Black leather biker jacket',
        description: 'A classic biker jacket in soft black leather, with an asymmetric zip and quilted lining.',
        type: 'clothing',
        audience: 'men',
        price: 9800,
        images: ['leather-biker-jacket'],
        options: clothingSizes,
        stock: 1,
      },
      {
        title: 'Oversized denim jacket',
        description: 'An easy oversized jacket in mid-wash denim, for layering over any outfit.',
        type: 'clothing',
        audience: 'women',
        price: 4900,
        images: ['denim-jacket-street'],
        options: clothingSizes,
        stock: 0,
      },
      {
        title: 'Light wash denim jacket',
        description: 'A classic light wash denim jacket with a slightly cropped cut. Goes with everything.',
        type: 'clothing',
        audience: 'women',
        price: 4600,
        images: ['denim-jacket-light', 'denim-jacket-street'],
        options: clothingSizes,
        stock: 8,
      },
      {
        title: 'Graphic tee and joggers set',
        description: 'A matching relaxed tee and tapered joggers. Comfortable enough for the whole weekend.',
        type: 'clothing',
        audience: 'women',
        price: 3800,
        images: ['tee-and-joggers'],
        options: clothingSizes,
        stock: 12,
      },
    ],
  },
];
