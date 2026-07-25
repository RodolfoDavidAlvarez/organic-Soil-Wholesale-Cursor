/** Curated Amazon customer reviews for home + product detail carousels. */

export type AmazonReview = {
  id: string;
  name: string;
  stars: 4 | 5;
  title: string;
  quote: string;
  product: string;
  /** Website product id(s) this review belongs to */
  productIds: number[];
  verifiedPurchase?: boolean;
  photo?: string;
};

export const AMAZON_REVIEWS: AmazonReview[] = [
  {
    id: "edavis-mikeys",
    name: "Edavis210",
    stars: 5,
    title: "Top of the quality I’ve managed to find",
    quote:
      "I live in the Sonoran Desert… Of all the worm castings, this is easily at the top of the quality I’ve managed to find. It worked into the soil beautifully and gave it that richness I know I need for amazing produce.",
    product: "Mikey’s Worm Poop",
    productIds: [1001],
  },
  {
    id: "smarr-mikeys",
    name: "S. Marr",
    stars: 5,
    title: "Like gold for plants",
    quote:
      "I had my own worm composter full of red wriggler worms. I know firsthand the benefits of worm compost. This stuff is like gold for plants — nutrient-rich, won’t burn like a fertilizer, and builds beneficial microbes in the soil.",
    product: "Mikey’s Worm Poop",
    productIds: [1001],
  },
  {
    id: "amazon-customer-mikeys",
    name: "Amazon Customer",
    stars: 5,
    title: "Best worm casting we’ve ever seen",
    quote: "Fresh ready to use.",
    product: "Mikey’s Worm Poop",
    productIds: [1001],
    verifiedPurchase: true,
  },
  {
    id: "suh-simons",
    name: "Suh",
    stars: 5,
    title: "My jasmine tree is back!",
    quote:
      "My jasmine tree is back! No more yellow leaves. Works really well. I’ve seen a difference in all of the plants I used it on. Will be buying again.",
    product: "Simon’s Gold",
    productIds: [1000],
    verifiedPurchase: true,
    photo: "/images/testimonials/amazon/B0D1568Q4M_suh_0.jpg",
  },
  {
    id: "debe-simons",
    name: "debe",
    stars: 5,
    title: "Great value!",
    quote:
      "Great product and price. Worked easily into plants both new & old. Also used in ground with a bed restoration.",
    product: "Simon’s Gold",
    productIds: [1000],
    verifiedPurchase: true,
  },
  {
    id: "jj-simons",
    name: "J J",
    stars: 4,
    title: "Best pepper harvest this year",
    quote:
      "I gave a handful of the fertilizer to pepper trees once a month, and I had one of the best pepper harvest this year than any other years. The plants grow better with this fertilizer.",
    product: "Simon’s Gold",
    productIds: [1000],
  },
  {
    id: "grisell-bacchus",
    name: "Grisell Alvarado",
    stars: 5,
    title: "It works fabulously!",
    quote:
      "I got my Victoria Red grape vine on clearance because it was almost dead. Transplanted into a bigger pot and added this fertilizer. I got so many grapes last year and she’s on track to produce a lot more this year!",
    product: "Bacchus",
    productIds: [1006],
    verifiedPurchase: true,
  },
  {
    id: "david-bacchus",
    name: "David Caldwell",
    stars: 4,
    title: "Grapes out the wazoo",
    quote:
      "The grape vines come out better than they have before. My one plant will have several bushels of grapes. Used the product and ordered more.",
    product: "Bacchus",
    productIds: [1006],
    verifiedPurchase: true,
  },
  {
    id: "shawn-bacchus",
    name: "Shawn A.",
    stars: 5,
    title: "My grapes are loving this mix!",
    quote:
      "I don’t think my grapes have ever looked this great. Whatever is in this mix, it’s making my grapes very happy.",
    product: "Bacchus",
    productIds: [1006],
  },
  {
    id: "cheryl-bacchus",
    name: "Cheryl Grimes",
    stars: 5,
    title: "Popped up 6 inches",
    quote:
      "Super excellent for your grapes! I mixed some up and added it to my failing babies and they popped up 6 inches higher than they were! 10/10!",
    product: "Bacchus",
    productIds: [1006],
  },
  {
    id: "eagle-rose",
    name: "E. Eagle",
    stars: 5,
    title: "Beautiful results",
    quote:
      "I have been blending this into the top soil once a month for the past 3 months and it has dramatically improved my roses. Multiple and beautiful blooms I haven’t had in the previous five years since planting them.",
    product: "Cultivator’s Rose Blend",
    productIds: [103],
    verifiedPurchase: true,
    photo: "/images/testimonials/amazon/B0D17198CX_e_eagle_0.jpg",
  },
  {
    id: "curious-plantpal",
    name: "Curious",
    stars: 5,
    title: "Great soil and no gnats",
    quote:
      "I used all of this soil to repot my bamboo plant. After repotting it is thriving — no transplant shock at all. Also, the soil was completely gnat free, which is a huge plus in my book.",
    product: "PlantPal",
    productIds: [111],
    photo: "/images/testimonials/amazon/B0DN1NYDRX_curious_0.jpg",
  },
  {
    id: "amanda-plantpal",
    name: "Amanda",
    stars: 5,
    title: "A ton of new growth",
    quote:
      "Fantastic soil for my aloe that needed repotting — I’ve noticed a ton of new growth. I love how easily the soil absorbs water but still drains well. Finally the water doesn’t just sit on top forever!",
    product: "PlantPal",
    productIds: [111],
  },
  {
    id: "albrecht-zeolite",
    name: "B. Albrecht",
    stars: 5,
    title: "Breathed new life into my flowerbed",
    quote:
      "After battling compacted, stubborn clay soil in my front flowerbed, I decided to give this Zeolite a try. My flowerbed stayed moist noticeably longer between waterings — and the plants looked perkier on the hotter days.",
    product: "Zeolite",
    productIds: [1011],
    photo: "/images/testimonials/amazon/B0DN1WTRM8_b_albrecht_0.jpg",
  },
  {
    id: "propagrow-clone",
    name: "Always something to do",
    stars: 5,
    title: "Works",
    quote:
      "I took a clone from a cherry tomato plant for a fall planting and the clone rooted well, as you can see from my photo. It seems like a high quality mix — works great for its intended purpose!",
    product: "PropaGrow",
    productIds: [114],
    photo: "/images/testimonials/amazon/B0DN1TS585_always_something_to_do_0.jpg",
  },
  {
    id: "th-turfdaddy",
    name: "T H",
    stars: 5,
    title: "Made a difference patching grass",
    quote:
      "I mixed it in a grass-formulated top soil, patched an area that always has trouble maintaining healthy grass, and watered daily for a week. The grass is off to a good start — definitely better than the last attempt.",
    product: "Turf Daddy",
    productIds: [1004],
  },
];

export function amazonReviewsForProduct(productId: number | null | undefined): AmazonReview[] {
  if (productId == null) return [];
  return AMAZON_REVIEWS.filter((r) => r.productIds.includes(productId));
}
