
const PRODUCTS = [
  {
    id: "hd-001",
    name: "French Linen Tailored Oversized Shirt",
    category: "T-Shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 88,
    originalPrice: 110,
    rating: 4.9,
    reviewCount: 142,
    sku: "HD-MEN-01",
    inStock: true,
    stockCount: 18,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1617127365659-c47fa864d8bc.jpg",
      "/images/photo-1594633312681-425c7b97ccd1.jpg"
    ],
    colors: [
      { name: "Terracotta Earth", hex: "#B85D38" },
      { name: "Raw Sand Linen", hex: "#E4DCB8" },
      { name: "Charcoal Slate", hex: "#2C2B27" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Tailored from 100% Normandy flax linen with natural slub texture, pre-washed for effortless drape. Features a crisp spread collar and natural horn buttons."
  },
  {
    id: "hd-002",
    name: "Liquid Silk Bias-Cut Slip Dress",
    category: "Dress",
    badge: "New Drop",
    badgeType: "new",
    price: 215,
    originalPrice: null,
    rating: 5.0,
    reviewCount: 56,
    sku: "HD-DRS-02",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: true,
    images: [
      "/images/photo-1539109136881-3be0616acf4b.jpg",
      "/images/photo-1515372039744-b8f02a3ae446.jpg"
    ],
    colors: [
      { name: "Champagne Cream", hex: "#F2EBE0" },
      { name: "Olive Earth", hex: "#6E7A67" },
      { name: "Obsidian Black", hex: "#161514" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Liquid silk-crepe woven in Como, Italy. Cut precisely on the bias to skim the silhouette with fluid elegance. Hand-finished delicate rouleau straps."
  },
  {
    id: "hd-003",
    name: "Emerald Silk Couture Saree Ensemble",
    category: "Dress",
    badge: "Limited Edition",
    badgeType: "hot",
    price: 340,
    originalPrice: 420,
    rating: 5.0,
    reviewCount: 39,
    sku: "HD-ETH-03",
    inStock: true,
    stockCount: 6,
    isNew: true,
    isSale: false,
    isBestSeller: true,
    images: [
      "/images/photo-1756483492198-8ca91227489b.jpg",
      "/images/photo-1742677143629-b9784beab2e1.jpg"
    ],
    colors: [
      { name: "Emerald Gold", hex: "#1C5E40" },
      { name: "Royal Garnet", hex: "#781C26" },
      { name: "Midnight Navy", hex: "#121F36" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Bespoke pure mulberry silk saree gown featuring intricate zardozi hand embroidery along the borders and pallu. A timeless fusion of heritage craftsmanship and modern runway silhouette."
  },
  {
    id: "hd-004",
    name: "Bespoke Sand Linen Tailored Blazer",
    category: "Top",
    badge: "Runway",
    badgeType: "new",
    price: 295,
    originalPrice: 360,
    rating: 4.9,
    reviewCount: 78,
    sku: "HD-BLZ-04",
    inStock: true,
    stockCount: 10,
    isNew: true,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1509319117193-57bab727e09d.jpg",
      "/images/photo-1516257984-b1b4d707412e.jpg"
    ],
    colors: [
      { name: "Sand Beige", hex: "#D8CDBC" },
      { name: "Charcoal Ink", hex: "#22211F" },
      { name: "Navy Twill", hex: "#1D2B3A" }
    ],
    sizes: ["38R", "40R", "42R", "44R"],
    description: "Lightweight unstructured single-breasted blazer woven from Italian flax linen. Notch lapel, patch pockets, and unlined interior for effortless breathability."
  },
  {
    id: "hd-005",
    name: "Sculpted Ribbed Merino Mockneck",
    category: "Top",
    badge: "Sale -20%",
    badgeType: "sale",
    price: 110,
    originalPrice: 138,
    rating: 4.8,
    reviewCount: 94,
    sku: "HD-TOP-05",
    inStock: true,
    stockCount: 15,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1521572163474-6864f9cf17ab.jpg",
      "/images/photo-1617137968427-85924c800a22.jpg"
    ],
    colors: [
      { name: "Warm Terracotta", hex: "#B85D38" },
      { name: "Ivory Cream", hex: "#FAF8F2" },
      { name: "Forest Olive", hex: "#2F4A37" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Extra-fine Australian merino wool with architectural compact ribbing. Designed to sculpt the frame while delivering supreme cloud-soft thermal comfort."
  },
  {
    id: "hd-006",
    name: "Kids' Organic Linen Pastel Romper",
    category: "Dress",
    badge: "Boutique Kids",
    badgeType: "new",
    price: 64,
    originalPrice: 80,
    rating: 4.9,
    reviewCount: 88,
    sku: "HD-KID-06",
    inStock: true,
    stockCount: 22,
    isNew: true,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1746386914795-83d2febc9a96.jpg",
      "/images/photo-1763089402370-fb496fefdbb0.jpg"
    ],
    colors: [
      { name: "Sage Mint", hex: "#9EB69E" },
      { name: "Oatmeal Cream", hex: "#ECE6DA" },
      { name: "Dusky Peach", hex: "#E8B2A2" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "7-8Y"],
    description: "GOTS-certified organic cotton and linen weave. Ultra-soft on delicate skin, reinforced wooden button closures, and roomy silhouette for effortless movement."
  },
  {
    id: "hd-007",
    name: "Liquid Charmeuse Pleated Maxi Skirt",
    category: "Skirt",
    badge: "Handcrafted",
    badgeType: "new",
    price: 168,
    originalPrice: null,
    rating: 5.0,
    reviewCount: 61,
    sku: "HD-SKT-07",
    inStock: true,
    stockCount: 16,
    isNew: true,
    isSale: false,
    isBestSeller: true,
    images: [
      "/images/photo-1515886657613-9f3515b0c78f.jpg",
      "/images/photo-1524504388940-b1c1722653e1.jpg"
    ],
    colors: [
      { name: "Oat Milk", hex: "#F3EDE3" },
      { name: "Terracotta Dusk", hex: "#C2703A" },
      { name: "Deep Espresso", hex: "#3A2A1E" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Weightless charmeuse skirt with finely gathered knife pleats that move fluidly with every step. Finished with a concealed side zip and a silky smooth inner slip for effortless drape."
  },
  {
    id: "hd-008",
    name: "Relaxed Boxy Oxford Weave Shirt",
    category: "T-Shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 96,
    originalPrice: 120,
    rating: 4.8,
    reviewCount: 129,
    sku: "HD-OXD-08",
    inStock: true,
    stockCount: 21,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1489987707025-afc232f7ea0f.jpg",
      "/images/photo-1618354691373-d851c5c3a990.jpg"
    ],
    colors: [
      { name: "Crisp White", hex: "#F7F5EF" },
      { name: "Sky Blue", hex: "#9BB8CC" },
      { name: "Charcoal Twill", hex: "#3B3B3B" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "A relaxed, boxy-cut oxford woven from dense cotton twill with a soft garment wash. Mother-of-pearl buttons and a curved hem deliver easy, modern polish that layers or stands alone."
  }
];

const COLLECTIONS_DATA = [
  {
    id: "col-women",
    title: "Women's Couture & Drapes",
    subtitle: "Liquid silks, structured linen separates, and heirloom sarees",
    itemCount: "58 styles",
    tag: "Trending",
    image: "/images/photo-1539533018447-63fcce2678e3.jpg"
  },
  {
    id: "col-men",
    title: "Men's Tailored Essentials",
    subtitle: "Unstructured linen blazers, relaxed trousers, and crisp shirts",
    itemCount: "44 styles",
    tag: "New Season",
    image: "/images/photo-1509631179647-0177331693ae.jpg"
  },
  {
    id: "col-kids",
    title: "Kids' Boutique Collection",
    subtitle: "Organic cotton and breezy linen crafted for playful elegance",
    itemCount: "36 styles",
    tag: "Summer Drop",
    image: "/images/photo-1518831959646-742c3a14ebf7.jpg"
  },
  {
    id: "col-knitwear",
    title: "Artisanal Knitwear & Tops",
    subtitle: "Featherweight merino wool and breathable openwork weaves",
    itemCount: "32 styles",
    tag: "Luxury",
    image: "/images/photo-1576566588028-4147f3842f27.jpg"
  }
];

const CATEGORY_SHOWCASE = [
  {
    id: "cat-men",
    title: "Men's Fashion",
    subtitle: "Sharp tailoring meets relaxed luxury",
    description: "From unstructured linen blazers and crisp French flax shirts to pleated trousers, our men's line blends Italian craftsmanship with modern silhouettes.",
    itemCount: "44 Curated Styles",
    image: "/images/photo-1506152983158-b4a74a01c721.jpg",
    accentImage: "/images/photo-1594938298603-c8148c4dae35.jpg",
    href: "/collection?category=men"
  },
  {
    id: "cat-women",
    title: "Women's Fashion",
    subtitle: "Editorial draping & timeless elegance",
    description: "Fluid silk bias dresses, rich designer sarees, and sculpted separates designed for the contemporary woman who values considered luxury.",
    itemCount: "58 Curated Styles",
    image: "/images/photo-1741816219933-2bf406bc9739.jpg",
    accentImage: "/images/photo-1741250782029-2770cfaf666c.jpg",
    href: "/collection?category=women"
  },
  {
    id: "cat-kids",
    title: "Kids' Fashion",
    subtitle: "Playful comfort in premium natural fibres",
    description: "Soft organic cottons and breathable linen sets crafted for active little explorers. Vibrant, comfortable, and made to cherish.",
    itemCount: "36 Curated Styles",
    image: "/images/photo-1471286174890-9c112ffca5b4.jpg",
    accentImage: "/images/photo-1567401893414-76b7b1e5a7a5.jpg",
    href: "/collection?category=kids"
  }
];

const INSTAGRAM_SHOWCASE = [
  {
    id: "insta-1",
    image: "/images/photo-1496217590455-aa63a8350eea.jpg",
    handle: "@zmw.studio",
    caption: "Sun-drenched tailoring & layered neutrals for effortless Mediterranean evenings.",
    likes: "3.4k"
  },
  {
    id: "insta-2",
    image: "/images/photo-1519741497674-611481863552.jpg",
    handle: "@zmw.studio",
    caption: "Flowing silk separates â€” the new summer wardrobe capsule.",
    likes: "5.8k"
  },
  {
    id: "insta-3",
    image: "/images/photo-1521566652839-697aa473761a.jpg",
    handle: "@zmw.studio",
    caption: "Editorial draping in warm, sun-lit neutrals. Shot on location.",
    likes: "6.2k"
  },
  {
    id: "insta-4",
    image: "/images/photo-1503919545889-aef636e10ad4.jpg",
    handle: "@zmw.studio",
    caption: "Kids' summer boutique capsule: breathable organic linens for sunny days.",
    likes: "2.9k"
  },
  {
    id: "insta-5",
    image: "/images/photo-1616415852242-2d061343d9a1.jpg",
    handle: "@zmw.studio",
    caption: "Feminine florals & fluid fabric â€” the 2026 Signature Collection.",
    likes: "4.7k"
  }
];

const TESTIMONIALS_DATA = [
  {
    id: "test-1",
    author: "Elena Rostova",
    role: "Verified Buyer",
    city: "Paris, France",
    rating: 5,
    title: "Unmatched linen quality and tailoring",
    comment: "The French flax linen shirt feels incredible right out of the box. The drape is effortless and the finishing touches around the collar and horn buttons demonstrate master craftsmanship.",
    productPurchased: "French Linen Tailored Oversized Shirt",
    date: "August 18, 2026"
  },
  {
    id: "test-2",
    author: "Sophia Sterling",
    role: "Fashion Director",
    city: "New York, USA",
    rating: 5,
    title: "The silk slip dress of my dreams",
    comment: "I have worn luxury slip dresses from top runway houses, and HooDee Daddy matches and even exceeds their cut. The bias construction falls so smoothly without clinging.",
    productPurchased: "Liquid Silk Bias-Cut Slip Dress",
    date: "August 24, 2026"
  },
  {
    id: "test-3",
    author: "Marcus Chen",
    role: "Verified Buyer",
    city: "Tokyo, Japan",
    rating: 5,
    title: "Remarkable attention to detail and fast delivery",
    comment: "Delivered to Tokyo in 3 days in plastic-free luxury linen packaging. The tailored sand linen blazer is a true work of artisan mastery. Customer care was delightful.",
    productPurchased: "Bespoke Sand Linen Tailored Blazer",
    date: "August 29, 2026"
  }
];

const BRAND_LOGOS = [
  "CAVALIA", "PANDOR", "FENNYAL", "LK-TECH", "SHANGHAI", "CHERYL", "VOGUE LAB"
];

/**
 * MEN_SUBCATEGORIES
 * Mirrors the Navbar's Men dropdown so the page's filter pills and the
 * nav's flyout menu always list the same set of subcategories.
 */
const MEN_SUBCATEGORIES = [
  "Round Neck T-shirt",
  "Polo T-shirt",
  "Mens Hoodies"
];

/**
 * MEN_PRODUCTS
 * Dedicated catalog for the Men's category page. Shares the exact same
 * product shape as PRODUCTS (see above) so it works with ProductCard,
 * the cart, wishlist, and quick-view without any special-casing â€”
 * only addition is `subCategory`, used for the page's filter pills.
 */
const MEN_PRODUCTS = [
  {
    id: "hd-m01",
    name: "Printed Round Neck T-Shirt - Jet Black & Off White",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 42,
    originalPrice: 58,
    rating: 4.8,
    reviewCount: 231,
    sku: "HD-MEN-OS-01",
    inStock: true,
    stockCount: 24,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1521572163474-6864f9cf17ab.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Military Green", hex: "#4B5A3F" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Heavyweight 240 GSM cotton jersey, boxy drop-shoulder cut with a front graphic print. Garment-washed for a broken-in feel from the first wear."
  },
  {
    id: "hd-m02",
    name: "Printed Round Neck T-Shirt - Charcoal & Rust",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 45,
    originalPrice: null,
    rating: 4.7,
    reviewCount: 88,
    sku: "HD-MEN-OS-02",
    inStock: true,
    stockCount: 16,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1516257984-b1b4d707412e.jpg",
      "/images/photo-1521572163474-6864f9cf17ab.jpg"
    ],
    colors: [
      { name: "Charcoal", hex: "#2C2B27" },
      { name: "Rust", hex: "#B85D38" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Motorsport-inspired racer stripe across the chest on a relaxed, drop-shoulder oversized silhouette. Ribbed crew neck for shape retention."
  },
  {
    id: "hd-m03",
    name: "Printed Round Neck T-Shirt - Sage Green & Stone Beige",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Trending",
    badgeType: "hot",
    price: 40,
    originalPrice: 52,
    rating: 4.9,
    reviewCount: 164,
    sku: "HD-MEN-OS-03",
    inStock: true,
    stockCount: 30,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1583743814966-8936f5b7be1a.jpg",
      "/images/photo-1521572163474-6864f9cf17ab.jpg"
    ],
    colors: [
      { name: "Sage Green", hex: "#6E7A67" },
      { name: "Stone Beige", hex: "#D8CDBC" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    description: "Embroidered script chest logo on brushed cotton fleece-jersey. Dropped shoulder seams and a slightly cropped body length for an oversized fit."
  },
  {
    id: "hd-m04",
    name: "Oversized Round Neck T-Shirt - Ivory & Jet Black",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: null,
    badgeType: "new",
    price: 44,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 52,
    sku: "HD-MEN-OS-04",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1618354691373-d851c5c3a990.jpg",
      "/images/photo-1602810318383-e386cc2a3ccf.jpg"
    ],
    colors: [
      { name: "Ivory", hex: "#FAF8F2" },
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Zip-neck placket on a heavyweight oversized tee, cut long with side vents. A quieter alternative to a full graphic print."
  },
  {
    id: "hd-m05",
    name: "Printed Round Neck T-Shirt - Racing Red & Jet Black",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Limited",
    badgeType: "hot",
    price: 46,
    originalPrice: 60,
    rating: 4.9,
    reviewCount: 97,
    sku: "HD-MEN-OS-05",
    inStock: true,
    stockCount: 9,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1576566588028-4147f3842f27.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Racing Red", hex: "#B3271D" },
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    description: "Motorsport graphic print wraps the front and sleeve on a boxy oversized cut. Limited run, numbered inner label."
  },
  {
    id: "hd-m06",
    name: "Oversized Round Neck T-Shirt - Olive & Off White",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 43,
    originalPrice: null,
    rating: 4.7,
    reviewCount: 61,
    sku: "HD-MEN-OS-06",
    inStock: true,
    stockCount: 20,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg",
      "/images/photo-1618354691792-d1d42acfd860.jpg"
    ],
    colors: [
      { name: "Olive", hex: "#4B5A3F" },
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "A clean numeral graphic on heavyweight cotton, cut boxy through the body with dropped shoulders for an easy oversized fit."
  },
  {
    id: "hd-m07",
    name: "Classic Polo T-Shirt - Ivory & Navy",
    category: "Polo",
    subCategory: "Polo T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 39,
    originalPrice: 50,
    rating: 4.8,
    reviewCount: 178,
    sku: "HD-MEN-PL-01",
    inStock: true,
    stockCount: 27,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1581655353564-df123a1eb820.jpg",
      "/images/photo-1562157873-818bc0726f68.jpg"
    ],
    colors: [
      { name: "Ivory", hex: "#FAF8F2" },
      { name: "Navy", hex: "#1D2B3A" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Pique cotton polo with a zip placket in place of buttons, regular fit through the body with a ribbed collar and cuffs."
  },
  {
    id: "hd-m08",
    name: "Classic Polo T-Shirt - Maroon & Jet Black",
    category: "Polo",
    subCategory: "Polo T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 41,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 44,
    sku: "HD-MEN-PL-02",
    inStock: true,
    stockCount: 15,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1586790170083-2f9ceadc732d.jpg",
      "/images/photo-1578587018452-892bacefd3f2.jpg"
    ],
    colors: [
      { name: "Maroon", hex: "#5C1F26" },
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    description: "Oversized pique polo with a tonal chest graphic. Dropped shoulders and a slightly extended hem for a modern streetwear proportion."
  },
  {
    id: "hd-m09",
    name: "Classic Polo T-Shirt - Espresso Brown & Off White",
    category: "Polo",
    subCategory: "Polo T-shirt",
    badge: "Trending",
    badgeType: "hot",
    price: 44,
    originalPrice: 55,
    rating: 4.9,
    reviewCount: 132,
    sku: "HD-MEN-PL-03",
    inStock: true,
    stockCount: 18,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1534030347209-467a5b0ad3e6.jpg",
      "/images/photo-1521572267360-ee0c2909d518.jpg"
    ],
    colors: [
      { name: "Espresso Brown", hex: "#3A2A1E" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "High-density heavyweight pique polo with a bold collegiate-style chest print, cut oversized with a ribbed placket collar."
  },
  {
    id: "hd-m10",
    name: "Classic Polo T-Shirt - Mustard Gold & Jet Black",
    category: "Polo",
    subCategory: "Polo T-shirt",
    badge: null,
    badgeType: "new",
    price: 42,
    originalPrice: null,
    rating: 4.5,
    reviewCount: 29,
    sku: "HD-MEN-PL-04",
    inStock: false,
    stockCount: 0,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1507679799987-c73779587ccf.jpg",
      "/images/photo-1534030347209-467a5b0ad3e6.jpg"
    ],
    colors: [
      { name: "Mustard Gold", hex: "#C89D3C" },
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["M", "L", "XL"],
    description: "High-neck placket polo in brushed pique cotton with contrast trim at the cuffs and collar. Currently out of stock â€” restocking soon."
  },
  {
    id: "hd-m11",
    name: "Classic Polo T-Shirt - Sand Beige & Sky Blue",
    category: "Polo",
    subCategory: "Polo T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 38,
    originalPrice: 48,
    rating: 4.7,
    reviewCount: 71,
    sku: "HD-MEN-PL-05",
    inStock: true,
    stockCount: 22,
    isNew: true,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1617127365659-c47fa864d8bc.jpg",
      "/images/photo-1521572267360-ee0c2909d518.jpg"
    ],
    colors: [
      { name: "Sand Beige", hex: "#D8CDBC" },
      { name: "Sky Blue", hex: "#9BB8CC" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "A quiet, regular-fit pique polo built for everyday rotation. Soft-washed finish with a two-button placket and side vents."
  },
  {
    id: "hd-m12",
    name: "Oversized Round Neck T-Shirt - Crisp White & Sky Blue",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 46,
    originalPrice: 58,
    rating: 4.8,
    reviewCount: 96,
    sku: "HD-MEN-01-2",
    inStock: true,
    stockCount: 19,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1602810318383-e386cc2a3ccf.jpg",
      "/images/photo-1618354691373-d851c5c3a990.jpg"
    ],
    colors: [
      { name: "Crisp White", hex: "#F7F5EF" },
      { name: "Sky Blue", hex: "#9BB8CC" },
      { name: "Charcoal Twill", hex: "#3B3B3B" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Oxford-weave cotton in a relaxed boxy cut, no branding â€” a wardrobe staple built to layer under a shirt or blazer."
  },
  {
    id: "hd-m13",
    name: "Classic Cotton Round Neck T-Shirt - Beige & Ivory",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: null,
    badgeType: "new",
    price: 37,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 33,
    sku: "HD-MEN-PT-02",
    inStock: true,
    stockCount: 14,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg",
      "/images/photo-1602810318383-e386cc2a3ccf.jpg"
    ],
    colors: [
      { name: "Beige", hex: "#D8CDBC" },
      { name: "Ivory", hex: "#FAF8F2" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Fine-gauge cotton long sleeve with a mock-neck placket. Regular fit, minimal branding â€” an easy layering piece."
  },
  {
    id: "hd-m14",
    name: "Classic Cotton Round Neck T-Shirt - Jet Black",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Trending",
    badgeType: "hot",
    price: 39,
    originalPrice: 49,
    rating: 4.7,
    reviewCount: 58,
    sku: "HD-MEN-PT-03",
    inStock: true,
    stockCount: 21,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1618354691792-d1d42acfd860.jpg",
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Heavyweight cotton full-sleeve tee with a clean crew neck. Solid black, garment-dyed for a deep, even tone."
  },
  {
    id: "hd-m19",
    name: "Oversized Round Neck T-Shirt - Navy Blue & White",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 44,
    originalPrice: 60,
    rating: 4.9,
    reviewCount: 198,
    sku: "HD-MEN-OS-07",
    inStock: true,
    stockCount: 22,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1576566588028-4147f3842f27.jpg",
      "/images/photo-1521572267360-ee0c2909d518.jpg"
    ],
    colors: [
      { name: "Navy Blue", hex: "#1A2B4C" },
      { name: "White", hex: "#F5F5F5" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Iconic dual-tone Originals 88 graphic with drop-shoulder boxy fit. Spun from 240 GSM combed cotton for a heavy drape."
  },
  {
    id: "hd-m20",
    name: "Oversized Round Neck T-Shirt - Off White & Crimson Red",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 48,
    originalPrice: 65,
    rating: 4.8,
    reviewCount: 84,
    sku: "HD-MEN-OS-08",
    inStock: true,
    stockCount: 16,
    isNew: true,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1562157873-818bc0726f68.jpg",
      "/images/photo-1618354691373-d851c5c3a990.jpg"
    ],
    colors: [
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Crimson Red", hex: "#A82B2B" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Street motorsport graphics on an off-white full-sleeve drop-shoulder tee. High-density contrast chest and sleeve prints."
  },
  {
    id: "hd-m21",
    name: "Printed Round Neck T-Shirt - Acid Black & Denim Blue",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Trending",
    badgeType: "hot",
    price: 46,
    originalPrice: 62,
    rating: 4.9,
    reviewCount: 142,
    sku: "HD-MEN-OS-09",
    inStock: true,
    stockCount: 19,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1578587018452-892bacefd3f2.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Acid Black", hex: "#222224" },
      { name: "Denim Blue", hex: "#3A506B" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Mineral acid-washed heavyweight tee with retro motorcycle typography print. Every piece boasts a unique faded vintage patina."
  },
  {
    id: "hd-m22",
    name: "Oversized Round Neck T-Shirt - Jet Black & Light Grey",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Sale",
    badgeType: "sale",
    price: 42,
    originalPrice: 56,
    rating: 4.7,
    reviewCount: 95,
    sku: "HD-MEN-OS-10",
    inStock: true,
    stockCount: 28,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1521572267360-ee0c2909d518.jpg",
      "/images/photo-1516257984-b1b4d707412e.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Light Grey", hex: "#D4D2CD" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "5-thread contrast lockstitch detail on seams with back racing typography graphic. Super combed heavyweight jersey."
  },
  {
    id: "hd-m23",
    name: "Printed Round Neck T-Shirt - Ivory White & Navy Blue",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 45,
    originalPrice: 58,
    rating: 4.8,
    reviewCount: 176,
    sku: "HD-MEN-OS-11",
    inStock: true,
    stockCount: 15,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1581655353564-df123a1eb820.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Ivory White", hex: "#FDFDFD" },
      { name: "Navy Blue", hex: "#1A2B4C" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "European football culture meets modern streetwear. Screen-printed back emblem with minimal front chest badge."
  },
  {
    id: "hd-m24",
    name: "Printed Round Neck T-Shirt - Jet Black & Hazelnut",
    category: "T-Shirt",
    subCategory: "Round Neck T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 47,
    originalPrice: null,
    rating: 4.9,
    reviewCount: 63,
    sku: "HD-MEN-OS-12",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1618354691373-d851c5c3a990.jpg",
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Hazelnut", hex: "#8A6D4B" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Mythological scarab artwork printed in warm hazelnut metallic ink on jet black combed cotton. Seamless side seams for pure boxy drape."
  },
  {
    id: "hd-m25",
    name: "Urban Cargo Joggers - Olive",
    category: "Joggers",

    badge: "Best Seller",
    badgeType: "hot",
    price: 52,
    originalPrice: 68,
    rating: 4.8,
    reviewCount: 167,
    sku: "HD-MEN-JG-01",
    inStock: true,
    stockCount: 25,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1509319117193-57bab727e09d.jpg",
      "/images/photo-1506152983158-b4a74a01c721.jpg"
    ],
    colors: [
      { name: "Olive Green", hex: "#4B5A3F" },
      { name: "Jet Black", hex: "#181715" },
      { name: "Sand Beige", hex: "#D8CDBC" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Heavyweight cotton twill joggers with utility cargo pockets. Elasticated waist with drawstring and tapered ankle cuffs for a clean streetwear silhouette."
  },
  {
    id: "hd-m26",
    name: "Slim Fit Tech Joggers - Black",
    category: "Joggers",

    badge: "New Drop",
    badgeType: "new",
    price: 48,
    originalPrice: null,
    rating: 4.7,
    reviewCount: 89,
    sku: "HD-MEN-JG-02",
    inStock: true,
    stockCount: 18,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1516257984-b1b4d707412e.jpg",
      "/images/photo-1507679799987-c73779587ccf.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Four-way stretch tech fabric joggers with a tapered slim fit. Moisture-wicking finish with zip pockets and reflective detailing for night runs."
  },
  {
    id: "hd-m27",
    name: "Relaxed French Terry Joggers - Sand",
    category: "Joggers",

    badge: "Trending",
    badgeType: "hot",
    price: 46,
    originalPrice: 58,
    rating: 4.9,
    reviewCount: 134,
    sku: "HD-MEN-JG-03",
    inStock: true,
    stockCount: 22,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1503341504253-dff4815485f1.jpg",
      "/images/photo-1509319117193-57bab727e09d.jpg"
    ],
    colors: [
      { name: "Sand Beige", hex: "#D8CDBC" },
      { name: "Oatmeal", hex: "#ECE6DA" },
      { name: "Slate Grey", hex: "#5C5C5C" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Brushed French terry joggers with a relaxed straight-leg cut. Ribbed cuffs and a soft elastic waistband for all-day comfort and premium drape."
  },
  {
    id: "hd-m28",
    name: "Track Joggers with Side Stripes",
    category: "Joggers",

    badge: "Sale",
    badgeType: "sale",
    price: 42,
    originalPrice: 55,
    rating: 4.6,
    reviewCount: 72,
    sku: "HD-MEN-JG-04",
    inStock: true,
    stockCount: 15,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1521572163474-6864f9cf17ab.jpg",
      "/images/photo-1516257984-b1b4d707412e.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Navy", hex: "#1D2B3A" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Classic track joggers with contrast side stripes. Lightweight poly-cotton blend with zip pockets and elasticated hem."
  },
  {
    id: "hd-m29",
    name: "Zip-Up Hoodie - Charcoal Slate & Jet Black",
    category: "Hoodie",
    subCategory: "Mens Hoodies",
    badge: "Best Seller",
    badgeType: "hot",
    price: 68,
    originalPrice: 88,
    rating: 4.9,
    reviewCount: 203,
    sku: "HD-MEN-HD-01",
    inStock: true,
    stockCount: 20,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1583743814966-8936f5b7be1a.jpg",
      "/images/photo-1578587018452-892bacefd3f2.jpg"
    ],
    colors: [
      { name: "Charcoal Slate", hex: "#2C2B27" },
      { name: "Jet Black", hex: "#181715" },
      { name: "Oatmeal", hex: "#ECE6DA" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "400 GSM heavyweight cotton fleece zip hoodie with YKK metal zippers. Kangaroo pocket, ribbed cuffs and hem, and a structured hood with drawstring."
  },
  {
    id: "hd-m30",
    name: "Basic Pullover Hoodie",
    category: "Hoodie",
    subCategory: "Mens Hoodies",
    badge: "New Drop",
    badgeType: "new",
    price: 72,
    originalPrice: null,
    rating: 4.8,
    reviewCount: 112,
    sku: "HD-MEN-HD-02",
    inStock: true,
    stockCount: 16,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1576566588028-4147f3842f27.jpg",
      "/images/photo-1583743814966-8936f5b7be1a.jpg"
    ],
    colors: [
      { name: "Forest Olive", hex: "#2F4A37" },
      { name: "Stone Beige", hex: "#D8CDBC" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Oversized pullover hoodie in 380 GSM brushed fleece. Drop-shoulder construction, ribbed hem and cuffs, with a deep kangaroo pocket."
  },
  {
    id: "hd-m31",
    name: "Printed Hoodie",
    category: "Hoodie",
    subCategory: "Mens Hoodies",
    badge: "Trending",
    badgeType: "hot",
    price: 65,
    originalPrice: 82,
    rating: 4.7,
    reviewCount: 98,
    sku: "HD-MEN-HD-03",
    inStock: true,
    stockCount: 14,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1618354691373-d851c5c3a990.jpg",
      "/images/photo-1576566588028-4147f3842f27.jpg"
    ],
    colors: [
      { name: "Washed Grey", hex: "#8A8680" },
      { name: "Washed Black", hex: "#2E2C2A" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Vintage acid-washed pullover hoodie with high-density embroidered logo. Soft brushed fleece interior with a relaxed, boxy fit."
  },
  {
    id: "hd-m32",
    name: "Zip-Up Hoodie - Ink Black & Slate Grey",
    category: "Hoodie",
    subCategory: "Mens Hoodies",
    badge: null,
    badgeType: "new",
    price: 70,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 45,
    sku: "HD-MEN-HD-04",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg",
      "/images/photo-1618354691792-d1d42acfd860.jpg"
    ],
    colors: [
      { name: "Ink Black", hex: "#161514" },
      { name: "Slate Grey", hex: "#5C5C5C" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Premium oversized zip hoodie in garment-dyed heavyweight cotton. Dropped shoulders, two-way zip, and hidden media pocket."
  },
  {
    id: "hd-m33",
    name: "Heavyweight Crewneck Sweatshirt - Navy",
    category: "Sweatshirt",

    badge: "Best Seller",
    badgeType: "hot",
    price: 58,
    originalPrice: 72,
    rating: 4.9,
    reviewCount: 187,
    sku: "HD-MEN-SS-01",
    inStock: true,
    stockCount: 24,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1602810318383-e386cc2a3ccf.jpg",
      "/images/photo-1521572163474-6864f9cf17ab.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#1D2B3A" },
      { name: "Charcoal", hex: "#2C2B27" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "420 GSM heavyweight French terry crewneck sweatshirt. Ribbed collar, cuffs, and hem with a clean, logo-free design for versatile layering."
  },
  {
    id: "hd-m34",
    name: "Half-Zip Sweatshirt - Stone",
    category: "Sweatshirt",

    badge: "New Drop",
    badgeType: "new",
    price: 62,
    originalPrice: null,
    rating: 4.7,
    reviewCount: 76,
    sku: "HD-MEN-SS-02",
    inStock: true,
    stockCount: 17,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg",
      "/images/photo-1602810318383-e386cc2a3ccf.jpg"
    ],
    colors: [
      { name: "Stone Beige", hex: "#D8CDBC" },
      { name: "Forest Olive", hex: "#2F4A37" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Half-zip sweatshirt in brushed French terry with a stand collar. Raglan sleeves and a relaxed fit for a sporty-luxe silhouette."
  },
  {
    id: "hd-m35",
    name: "Oversized Logo Crewneck Sweatshirt",
    category: "Sweatshirt",

    badge: "Trending",
    badgeType: "hot",
    price: 56,
    originalPrice: 70,
    rating: 4.8,
    reviewCount: 143,
    sku: "HD-MEN-SS-03",
    inStock: true,
    stockCount: 20,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1521572267360-ee0c2909d518.jpg",
      "/images/photo-1622470953794-aa9c70b0fb9d.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Oversized crewneck sweatshirt with tonal embroidered logo across the chest. 360 GSM brushed fleece with drop-shoulder seams."
  },
  {
    id: "hd-m36",
    name: "Striped Crewneck Sweatshirt - Retro",
    category: "Sweatshirt",

    badge: "Sale",
    badgeType: "sale",
    price: 48,
    originalPrice: 62,
    rating: 4.6,
    reviewCount: 62,
    sku: "HD-MEN-SS-04",
    inStock: true,
    stockCount: 11,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1503341504253-dff4815485f1.jpg",
      "/images/photo-1516257984-b1b4d707412e.jpg"
    ],
    colors: [
      { name: "Navy Stripe", hex: "#1D2B3A" },
      { name: "Burgundy Stripe", hex: "#6B1D2A" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Retro-inspired horizontal stripe crewneck in soft-brushed French terry. Relaxed fit with a ribbed collar, cuffs, and hem."
  }
];

/**
 * WOMEN_SUBCATEGORIES
 * Mirrors the Navbar's Women dropdown so the page's filter pills and the
 * nav's flyout menu always list the same set of subcategories.
 */
const WOMEN_SUBCATEGORIES = ["Round Neck", "V Neck", "Women's Hoodies", "Women's Tees"];

/**
 * WOMEN_PRODUCTS
 * Dedicated catalog for the Women's category page. Shares the exact same
 * product shape as MEN_PRODUCTS so it works with ProductCard, the cart,
 * wishlist, and quick-view without any special-casing â€” only addition is
 * `subCategory`, used for the page's filter pills.
 */
const WOMEN_PRODUCTS = [
  {
    id: "hd-w01",
    name: "Women's Oversized Tee - Sunflower Yellow & Off White",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "Best Seller",
    badgeType: "hot",
    price: 38,
    originalPrice: 50,
    rating: 4.8,
    reviewCount: 204,
    sku: "HD-WOM-PT-01",
    inStock: true,
    stockCount: 26,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1594633312681-425c7b97ccd1.jpg",
      "/images/photo-1539109136881-3be0616acf4b.jpg"
    ],
    colors: [
      { name: "Sunflower Yellow", hex: "#E8B93C" },
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Sky Blue", hex: "#9BB8CC" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Collegiate varsity graphic on a relaxed boxy tee, garment-washed cotton jersey with dropped shoulders for an easy, oversized fit."
  },
  {
    id: "hd-w02",
    name: "Graphic Tee - Jet Black & Sage Green",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "New Drop",
    badgeType: "new",
    price: 36,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 61,
    sku: "HD-WOM-PT-02",
    inStock: true,
    stockCount: 18,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1515372039744-b8f02a3ae446.jpg",
      "/images/photo-1756483492198-8ca91227489b.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Sage Green", hex: "#6E7A67" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Retro cursive script across the chest on soft-washed single jersey. Cropped-through-regular length for easy layering over co-ords."
  },
  {
    id: "hd-w03",
    name: "Women's Oversized Tee - Ivory & Blush Pink",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "Trending",
    badgeType: "hot",
    price: 39,
    originalPrice: 48,
    rating: 4.9,
    reviewCount: 132,
    sku: "HD-WOM-PT-03",
    inStock: true,
    stockCount: 21,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1742677143629-b9784beab2e1.jpg",
      "/images/photo-1594633312681-425c7b97ccd1.jpg"
    ],
    colors: [
      { name: "Ivory", hex: "#FAF8F2" },
      { name: "Blush Pink", hex: "#E3B9B0" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Hand-drawn floral print on a boxy, relaxed silhouette. Ribbed crew neck and a slightly cropped hem for high-waist styling."
  },
  {
    id: "hd-w04",
    name: "Graphic Tee - Racing Red & Jet Black",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: null,
    badgeType: "new",
    price: 37,
    originalPrice: null,
    rating: 4.5,
    reviewCount: 39,
    sku: "HD-WOM-PT-04",
    inStock: true,
    stockCount: 15,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1509319117193-57bab727e09d.jpg",
      "/images/photo-1756483492198-8ca91227489b.jpg"
    ],
    colors: [
      { name: "Racing Red", hex: "#B3271D" },
      { name: "Jet Black", hex: "#181715" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Motorsport-inspired chest graphic on breathable cotton jersey, cut with a relaxed body and short dropped sleeves."
  },
  {
    id: "hd-w05",
    name: "Women's Oversized Tee - Sunflower Yellow & Ivory",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "Best Seller",
    badgeType: "hot",
    price: 40,
    originalPrice: 52,
    rating: 4.8,
    reviewCount: 176,
    sku: "HD-WOM-PT-05",
    inStock: true,
    stockCount: 23,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1746386914795-83d2febc9a96.jpg",
      "/images/photo-1763089402370-fb496fefdbb0.jpg"
    ],
    colors: [
      { name: "Sunflower Yellow", hex: "#E8B93C" },
      { name: "Ivory", hex: "#FAF8F2" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Collegiate university crest print in a relaxed, colorblocked boxy tee â€” pairs easily with joggers or a midi skirt."
  },
  {
    id: "hd-w06",
    name: "Graphic Tee - Stone Beige",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "New Drop",
    badgeType: "new",
    price: 35,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 47,
    sku: "HD-WOM-PT-06",
    inStock: false,
    stockCount: 0,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1515886657613-9f3515b0c78f.jpg",
      "/images/photo-1524504388940-b1c1722653e1.jpg"
    ],
    colors: [
      { name: "Stone Beige", hex: "#D8CDBC" }
    ],
    sizes: ["XS", "S", "M"],
    description: "Delicate single-line art print on lightweight combed cotton. Currently out of stock â€” restocking soon."
  },
  {
    id: "hd-w19",
    name: "Women's Oversized Tee - Graphite & Off White",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "Trending",
    badgeType: "hot",
    price: 38,
    originalPrice: 50,
    rating: 4.8,
    reviewCount: 88,
    sku: "HD-WOM-PT-05",
    inStock: true,
    stockCount: 18,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1583496661160-fb5886a0aaaa.jpg",
      "/images/photo-1741250782029-2770cfaf666c.jpg"
    ],
    colors: [
      { name: "Graphite", hex: "#333138" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Oversized drop-shoulder tee with a high-density downtown skyline print. 240 GSM combed cotton with a soft, boxy drape."
  },
  {
    id: "hd-w20",
    name: "Graphic Tee - Sand & Terracotta",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "New Drop",
    badgeType: "new",
    price: 34,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 41,
    sku: "HD-WOM-PT-06",
    inStock: true,
    stockCount: 21,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1591047139829-d91aecb6caea.jpg",
      "/images/photo-1496217590455-aa63a8350eea.jpg"
    ],
    colors: [
      { name: "Sand", hex: "#E6D5BE" },
      { name: "Terracotta", hex: "#C25A38" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Retro sunset-and-palm screen print on a relaxed-fit tee, garment-washed for a vintage feel and natural softness."
  },
  {
    id: "hd-w21",
    name: "Graphic Tee - Ivory & Clay",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: "Sale",
    badgeType: "sale",
    price: 32,
    originalPrice: 42,
    rating: 4.7,
    reviewCount: 55,
    sku: "HD-WOM-PT-07",
    inStock: true,
    stockCount: 14,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1594938298603-c8148c4dae35.jpg",
      "/images/photo-1524504388940-b1c1722653e1.jpg"
    ],
    colors: [
      { name: "Ivory", hex: "#FAF8F2" },
      { name: "Clay", hex: "#A96A44" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Freehand abstract line-art print on lightweight slub cotton with a slightly cropped, modern silhouette."
  },
  {
    id: "hd-w22",
    name: "Graphic Tee - Onyx & Moon Grey",
    category: "T-Shirt",
    subCategory: "Women's Tees",
    badge: null,
    badgeType: "new",
    price: 36,
    originalPrice: 46,
    rating: 4.7,
    reviewCount: 63,
    sku: "HD-WOM-PT-08",
    inStock: true,
    stockCount: 16,
    isNew: true,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1756483492198-8ca91227489b.jpg",
      "/images/photo-1515372039744-b8f02a3ae446.jpg"
    ],
    colors: [
      { name: "Onyx", hex: "#232226" },
      { name: "Moon Grey", hex: "#C9C7C2" }
    ],
    sizes: ["XS", "S", "M"],
    description: "High-contrast celestial print on a cropped boxy tee, cut from heavyweight cotton with ribbed neckline."
  },
  {
    id: "hd-w23",
    name: "Linen Blend Co-ord Set - Sage",
    category: "Co-ord",
    badge: "Best Seller",
    badgeType: "hot",
    price: 88,
    originalPrice: 115,
    rating: 4.9,
    reviewCount: 156,
    sku: "HD-WOM-CO-01",
    inStock: true,
    stockCount: 18,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1539109136881-3be0616acf4b.jpg",
      "/images/photo-1515372039744-b8f02a3ae446.jpg"
    ],
    colors: [
      { name: "Sage Green", hex: "#6E7A67" },
      { name: "Oat Milk", hex: "#F3EDE3" },
      { name: "Terracotta", hex: "#C25A38" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Matching linen-blend crop top and wide-leg trouser set. Breathable weave with a relaxed drape, perfect for effortless summer styling."
  },
  {
    id: "hd-w24",
    name: "Ribbed Knit Co-ord - Espresso",
    category: "Co-ord",
    badge: "New Drop",
    badgeType: "new",
    price: 76,
    originalPrice: null,
    rating: 4.7,
    reviewCount: 88,
    sku: "HD-WOM-CO-02",
    inStock: true,
    stockCount: 14,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1742677143629-b9784beab2e1.jpg",
      "/images/photo-1756483492198-8ca91227489b.jpg"
    ],
    colors: [
      { name: "Espresso Brown", hex: "#3A2A1E" },
      { name: "Cream", hex: "#FAF8F2" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Form-fitting ribbed knit co-ord with a mock-neck crop top and high-waisted midi skirt. Stretchy, soft, and endlessly versatile."
  },
  {
    id: "hd-w25",
    name: "Cotton Poplin Co-ord Set - White",
    category: "Co-ord",
    badge: "Trending",
    badgeType: "hot",
    price: 82,
    originalPrice: 105,
    rating: 4.8,
    reviewCount: 132,
    sku: "HD-WOM-CO-03",
    inStock: true,
    stockCount: 20,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1524504388940-b1c1722653e1.jpg",
      "/images/photo-1515886657613-9f3515b0c78f.jpg"
    ],
    colors: [
      { name: "Crisp White", hex: "#F7F5EF" },
      { name: "Sky Blue", hex: "#9BB8CC" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Structured cotton poplin co-ord with a relaxed button-front shirt and tailored high-waisted trousers. Clean lines for polished ease."
  },
  {
    id: "hd-w26",
    name: "Oversized Tee & Mini Skirt Co-ord - Noir",
    category: "Co-ord",
    badge: null,
    badgeType: "new",
    price: 68,
    originalPrice: null,
    rating: 4.6,
    reviewCount: 44,
    sku: "HD-WOM-CO-04",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1509319117193-57bab727e09d.jpg",
      "/images/photo-1594938298603-c8148c4dae35.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description: "Drop-shoulder oversized tee paired with a matching A-line mini skirt. Heavyweight combed cotton with a relaxed, coordinated streetwear look."
  }
];

/**
 * KIDS_SUBCATEGORIES
 * Mirrors the Navbar's Kids dropdown so the page's filter pills and the
 * nav's flyout menu always list the same set of subcategories.
 */
const KIDS_SUBCATEGORIES = ["Boys", "Girls"];

const BOYS_SUBCATEGORIES = [
  "Round Neck",
  "High Neck",
  "Shorts",
  "Sweatshirts",
  "Hoodies"
];

const GIRLS_SUBCATEGORIES = [
  "Round Neck",
  "High Neck",
  "Shorts",
  "Sweatshirts",
  "Hoodies",
  "Casual Wear",
  "Long Gown"
];

const BABIES_SUBCATEGORIES = [
  "Romper",
  "T-shirt",
  "Babies Pyjama",
  "Sweatshirts",
  "Babies Hoodies",
  "Babies Bottoms"
];

/**
 * KIDS_PRODUCTS
 * Dedicated catalog for the Kids' category page. Shares the exact same
 * product shape as MEN_PRODUCTS / WOMEN_PRODUCTS so it works with
 * ProductCard, the cart, wishlist, and quick-view without any
 * special-casing â€” sizes use age bands (e.g. "2-3Y") instead of
 * letter sizes, and `subCategory` drives the page's filter pills.
 */
const KIDS_PRODUCTS = [
  {
    id: "hd-k01",
    name: "Dino Explorer Graphic Tee & Shorts Set",
    category: "T-Shirt Set",
    subCategory: "Shorts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 22,
    originalPrice: 30,
    rating: 4.9,
    reviewCount: 178,
    sku: "HD-KID-BY-01",
    inStock: true,
    stockCount: 34,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1596870230751-ebdfce98ec42.jpg",
      "/images/photo-1519238263530-99bdd11df2ea.jpg"
    ],
    colors: [
      { name: "Jungle Green", hex: "#4B5A3F" },
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Navy", hex: "#28344A" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Soft-washed cotton tee with a playful dino print, paired with elastic-waist shorts for easy on-off. Built for a full day of play."
  },
  {
    id: "hd-k03",
    name: "Space Mission Graphic Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 16,
    originalPrice: 22,
    rating: 4.8,
    reviewCount: 112,
    sku: "HD-KID-BY-03",
    inStock: true,
    stockCount: 40,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1519238263530-99bdd11df2ea.jpg",
      "/images/photo-1590480598135-3be152c87913.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Sky Blue", hex: "#9BB8CC" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Glow-in-the-dark rocket graphic on breathable single jersey cotton. Reinforced neckline stitching for wear after wear."
  },
  {
    id: "hd-k07",
    name: "Ruffle Sleeve Graphic Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    reviewCount: 91,
    sku: "HD-KID-GL-03",
    inStock: true,
    stockCount: 33,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1519457431-44ccd64a579b.jpg",
      "/images/photo-1758782213532-bbb5fd89885e.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Lilac", hex: "#B7A6D9" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Ruffle-sleeve tee with a glitter-free heart print, soft-washed for a broken-in feel from the first wear."
  },
  {
    id: "hd-k13",
    name: "Varsity Stripe Polo & Shorts Set",
    category: "T-Shirt Set",
    subCategory: "Shorts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 25,
    originalPrice: 33,
    rating: 4.8,
    reviewCount: 88,
    sku: "HD-KID-BY-05",
    inStock: true,
    stockCount: 24,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1758782213532-bbb5fd89885e.jpg",
      "/images/photo-1590480598135-3be152c87913.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#28344A" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Pique polo with contrast stripe collar, paired with matching shorts. Breathable and easy to layer for school or play."
  },
  {
    id: "hd-k17",
    name: "Shark Attack Graphic Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Best Seller",
    badgeType: "hot",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    reviewCount: 73,
    sku: "HD-KID-BY-07",
    inStock: true,
    stockCount: 26,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1445205170230-053b83016050.jpg",
      "/images/photo-1503342217505-b0a15ec3261c.jpg"
    ],
    colors: [
      { name: "Ocean Blue", hex: "#2F5E9E" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Playful shark graphic on breathable single-jersey cotton with reinforced neckline stitching and a tagless back."
  },
  {
    id: "hd-k18",
    name: "Rainbow Hearts Graphic Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 14,
    originalPrice: 19,
    rating: 4.7,
    reviewCount: 58,
    sku: "HD-KID-GL-07",
    inStock: true,
    stockCount: 31,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1487222477894-8943e31ef7b2.jpg",
      "/images/photo-1509631179647-0177331693ae.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Lilac", hex: "#B7A6D9" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Rainbow heart print on a soft-washed tee with flutter sleeves â€” breathable and comfortable for all-day play."
  },
  {
    id: "hd-k19",
    name: "Construction Crew Graphic Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "New Drop",
    badgeType: "new",
    price: 16,
    originalPrice: 22,
    rating: 4.6,
    reviewCount: 44,
    sku: "HD-KID-BY-08",
    inStock: true,
    stockCount: 19,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1490481651871-ab68de25d43d.jpg",
      "/images/photo-1539533018447-63fcce2678e3.jpg"
    ],
    colors: [
      { name: "Hard Hat Yellow", hex: "#E8BE3C" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Construction-truck print in high-density inks on a sturdy everyday tee, made to survive the sandbox and the slide."
  },
  {
    id: "hd-k20",
    name: "Butterfly Garden Print Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Best Seller",
    badgeType: "hot",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    reviewCount: 67,
    sku: "HD-KID-GL-08",
    inStock: true,
    stockCount: 28,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1544441893-675973e31985.jpg",
      "/images/photo-1560243563-062bfc001d68.jpg"
    ],
    colors: [
      { name: "Meadow Green", hex: "#6E8E5F" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Butterfly garden print with soft watercolor-style inks on combed cotton, cut for easy on-off wear."
  },
  {
    id: "hd-k21",
    name: "Astro Rocket Friend Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "New Drop",
    badgeType: "new",
    price: 16,
    originalPrice: null,
    rating: 4.5,
    reviewCount: 29,
    sku: "HD-KID-BY-09",
    inStock: true,
    stockCount: 17,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1567401893414-76b7b1e5a7a5.jpg",
      "/images/photo-1617137968427-85924c800a22.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#28344A" },
      { name: "Ivory", hex: "#FAF8F2" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Friendly cartoon rocket print with glow-in-the-dark accents. Soft single-jersey cotton in a relaxed play fit."
  },
  {
    id: "hd-k22",
    name: "Sweet Treats Hearts Tee",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Sale",
    badgeType: "sale",
    price: 14,
    originalPrice: 19,
    rating: 4.7,
    reviewCount: 52,
    sku: "HD-KID-GL-09",
    inStock: true,
    stockCount: 23,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1590480598135-3be152c87913.jpg",
      "/images/photo-1758782213532-bbb5fd89885e.jpg"
    ],
    colors: [
      { name: "Strawberry", hex: "#D96A7C" },
      { name: "Vanilla", hex: "#F5EFE0" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Cupcake-and-heart print on a supersoft washed tee with a gently rounded hem â€” a sweet everyday favorite."
  }
];

/**
 * BOYS_PRODUCTS
 * Dedicated catalog for the Boys' category page. Covers every Boys'
 * subcategory — Round Neck, High Neck, Shorts, Sweatshirts and Hoodies.
 */
const BOYS_PRODUCTS = [
  {
    id: "hd-b01",
    name: "Printed Round Neck T-Shirt",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Best Seller",
    badgeType: "hot",
    price: 15,
    originalPrice: 20,
    rating: 4.9,
    reviewCount: 156,
    sku: "HD-BOY-TS-01",
    inStock: true,
    stockCount: 38,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1596870230751-ebdfce98ec42.jpg",
      "/images/photo-1519238263530-99bdd11df2ea.jpg"
    ],
    colors: [
      { name: "Navy Blue", hex: "#28344A" },
      { name: "Off White", hex: "#F3EFE4" },
      { name: "Brick Red", hex: "#A83A26" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Soft-washed combed cotton tee with a bold wave graphic. Ribbed crew neck and reinforced seams for daily play."
  },
  {
    id: "hd-b02",
    name: "Printed Round Neck T-Shirt - Sky Blue & Crisp White",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 16,
    originalPrice: 21,
    rating: 4.8,
    reviewCount: 98,
    sku: "HD-BOY-TS-02",
    inStock: true,
    stockCount: 31,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1519238263530-99bdd11df2ea.jpg",
      "/images/photo-1509631179647-0177331693ae.jpg"
    ],
    colors: [
      { name: "Sky Blue", hex: "#9BB8CC" },
      { name: "Crisp White", hex: "#F7F5EF" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Nautical stripe tee in breathable single jersey with a tagless neck and pre-shrunk cotton finish."
  },
  {
    id: "hd-b03",
    name: "Boys High Neck T-Shirt",
    category: "High Neck",
    subCategory: "High Neck",
    badge: "New Drop",
    badgeType: "new",
    price: 19,
    originalPrice: 24,
    rating: 4.7,
    reviewCount: 74,
    sku: "HD-BOY-HN-01",
    inStock: true,
    stockCount: 26,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1503342217505-b0a15ec3261c.jpg",
      "/images/photo-1507679799987-c73779587ccf.jpg"
    ],
    colors: [
      { name: "Forest Olive", hex: "#2F4A37" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Brushed fleece high-neck top with a covered mock neckline. Warm, soft and easy to layer under hoodies."
  },
  {
    id: "hd-b04",
    name: "Boys Zip High Neck T-Shirt",
    category: "High Neck",
    subCategory: "High Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 20,
    originalPrice: 26,
    rating: 4.8,
    reviewCount: 67,
    sku: "HD-BOY-HN-02",
    inStock: true,
    stockCount: 19,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1507679799987-c73779587ccf.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#1D2B3A" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Sporty zip-neck high top with contrast trim. Lightweight French terry with soft-brushed interior."
  },
  {
    id: "hd-b05",
    name: "Boys Cotton Shorts",
    category: "Shorts",
    subCategory: "Shorts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 16,
    originalPrice: 21,
    rating: 4.8,
    reviewCount: 143,
    sku: "HD-BOY-SH-01",
    inStock: true,
    stockCount: 34,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1590480598135-3be152c87913.jpg",
      "/images/photo-1445205170230-053b83016050.jpg"
    ],
    colors: [
      { name: "Olive", hex: "#4B5A3F" },
      { name: "Khaki", hex: "#C2A878" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Sturdy cotton twill shorts with utility cargo pockets and an elasticated waist for easy on-off."
  },
  {
    id: "hd-b06",
    name: "Casual Shorts",
    category: "Shorts",
    subCategory: "Shorts",
    badge: "New Drop",
    badgeType: "new",
    price: 15,
    originalPrice: 20,
    rating: 4.7,
    reviewCount: 88,
    sku: "HD-BOY-SH-02",
    inStock: true,
    stockCount: 27,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1445205170230-053b83016050.jpg",
      "/images/photo-1490481651871-ab68de25d43d.jpg"
    ],
    colors: [
      { name: "Jet Black", hex: "#181715" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Brushed fleece jogger shorts with ribbed cuffs and a drawstring waist for a snug, comfy fit."
  },
  {
    id: "hd-b07",
    name: "Boys Cotton Sweatshirt",
    category: "Sweatshirt",
    subCategory: "Sweatshirts",
    badge: "Trending",
    badgeType: "hot",
    price: 22,
    originalPrice: 28,
    rating: 4.8,
    reviewCount: 121,
    sku: "HD-BOY-SW-01",
    inStock: true,
    stockCount: 24,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1509631179647-0177331693ae.jpg",
      "/images/photo-1503342217505-b0a15ec3261c.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#1D2B3A" },
      { name: "Heather Grey", hex: "#8A8680" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Heavyweight French terry crewneck with a ribbed collar, cuffs and hem. Built for rough-and-tumble days."
  },
  {
    id: "hd-b08",
    name: "Printed Sweatshirt",
    category: "Sweatshirt",
    subCategory: "Sweatshirts",
    badge: "New Drop",
    badgeType: "new",
    price: 21,
    originalPrice: 27,
    rating: 4.7,
    reviewCount: 66,
    sku: "HD-BOY-SW-02",
    inStock: true,
    stockCount: 20,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1503342217505-b0a15ec3261c.jpg",
      "/images/photo-1503919545889-aef636e10ad4.jpg"
    ],
    colors: [
      { name: "Red & White", hex: "#B3271D" },
      { name: "Navy & White", hex: "#1D2B3A" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Sporty color-block sweatshirt in soft brushed fleece with a bold contrast chest panel."
  },
  {
    id: "hd-b09",
    name: "Boys Zip-Up Hoodie",
    category: "Hoodie",
    subCategory: "Hoodies",
    badge: "Best Seller",
    badgeType: "hot",
    price: 25,
    originalPrice: 32,
    rating: 4.9,
    reviewCount: 132,
    sku: "HD-BOY-HD-01",
    inStock: true,
    stockCount: 22,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1506152983158-b4a74a01c721.jpg",
      "/images/photo-1496217590455-aa63a8350eea.jpg"
    ],
    colors: [
      { name: "Charcoal", hex: "#2C2B27" },
      { name: "Olive", hex: "#4B5A3F" },
      { name: "Navy", hex: "#1D2B3A" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Zip-up hoodie in brushed cotton rich fleece with a kangaroo pocket and drawcord hood."
  },
  {
    id: "hd-b10",
    name: "Boys Pullover Hoodie",
    category: "Hoodie",
    subCategory: "Hoodies",
    badge: "New Drop",
    badgeType: "new",
    price: 24,
    originalPrice: 30,
    rating: 4.8,
    reviewCount: 79,
    sku: "HD-BOY-HD-02",
    inStock: true,
    stockCount: 18,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1496217590455-aa63a8350eea.jpg",
      "/images/photo-1503919545889-aef636e10ad4.jpg"
    ],
    colors: [
      { name: "Sky Blue", hex: "#9BB8CC" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Easy pullover hoodie in soft brushed fleece with a roomy hood and ribbed trims."
  }
];

/**
 * GIRLS_PRODUCTS
 * Dedicated catalog for the Girls' category page. Covers every Girls'
 * subcategory — Round Neck, High Neck, Shorts, Sweatshirts, Hoodies,
 * Night Wear and Long Gown.
 */
const GIRLS_PRODUCTS = [
  {
    id: "hd-g01",
    name: "Printed T-Shirt",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Best Seller",
    badgeType: "hot",
    price: 14,
    originalPrice: 19,
    rating: 4.9,
    reviewCount: 165,
    sku: "HD-GIR-TS-01",
    inStock: true,
    stockCount: 36,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1519457431-44ccd64a579b.jpg",
      "/images/photo-1758782213532-bbb5fd89885e.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Lilac", hex: "#B7A6D9" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Buttercup print tee in soft-washed cotton with flutter-sleeve detail and a gentle rounded hem."
  },
  {
    id: "hd-g02",
    name: "Printed T-Shirt - Peony & Vanilla",
    category: "T-Shirt",
    subCategory: "Round Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    reviewCount: 104,
    sku: "HD-GIR-TS-02",
    inStock: true,
    stockCount: 29,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1758782213532-bbb5fd89885e.jpg",
      "/images/photo-1519457431-44ccd64a579b.jpg"
    ],
    colors: [
      { name: "Peony", hex: "#E87BA0" },
      { name: "Vanilla", hex: "#F5EFE0" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Charming heart print tee in breathable single jersey, garment-washed for softness from the first wear."
  },
  {
    id: "hd-g03",
    name: "Girls High Neck T-Shirt",
    category: "High Neck",
    subCategory: "High Neck",
    badge: "New Drop",
    badgeType: "new",
    price: 19,
    originalPrice: 25,
    rating: 4.8,
    reviewCount: 87,
    sku: "HD-GIR-HN-01",
    inStock: true,
    stockCount: 24,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1544441893-675973e31985.jpg",
      "/images/photo-1560243563-062bfc001d68.jpg"
    ],
    colors: [
      { name: "Coral", hex: "#E5816A" },
      { name: "Cream", hex: "#F5EFE0" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Pretty high-neck top with airy flutter sleeves and soft ruffle trims in lightweight cotton."
  },
  {
    id: "hd-g04",
    name: "Full Sleeve High Neck",
    category: "High Neck",
    subCategory: "High Neck",
    badge: "Trending",
    badgeType: "hot",
    price: 18,
    originalPrice: 23,
    rating: 4.7,
    reviewCount: 62,
    sku: "HD-GIR-HN-02",
    inStock: true,
    stockCount: 21,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1560243563-062bfc001d68.jpg",
      "/images/photo-1487222477894-8943e31ef7b2.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Crisp White", hex: "#F7F5EF" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Stretchy ribbed knit long sleeve with a snug high neck for cozy warmth on cooler days."
  },
  {
    id: "hd-g05",
    name: "Girls Cotton Shorts - Dusky Peach & Sage Mint",
    category: "Shorts",
    subCategory: "Shorts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 16,
    originalPrice: 21,
    rating: 4.8,
    reviewCount: 118,
    sku: "HD-GIR-SH-01",
    inStock: true,
    stockCount: 30,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1503919545889-aef636e10ad4.jpg",
      "/images/photo-1490481651871-ab68de25d43d.jpg"
    ],
    colors: [
      { name: "Dusky Peach", hex: "#E8B2A2" },
      { name: "Sage Mint", hex: "#9EB69E" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Tiered ruffle shorts in soft woven cotton with an elasticated waist and full cotton lining."
  },
  {
    id: "hd-g06",
    name: "Girls Cotton Shorts - Lavender & Off White",
    category: "Shorts",
    subCategory: "Shorts",
    badge: "New Drop",
    badgeType: "new",
    price: 15,
    originalPrice: 20,
    rating: 4.7,
    reviewCount: 73,
    sku: "HD-GIR-SH-02",
    inStock: true,
    stockCount: 26,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1490481651871-ab68de25d43d.jpg",
      "/images/photo-1567401893414-76b7b1e5a7a5.jpg"
    ],
    colors: [
      { name: "Lavender", hex: "#B7A6D9" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    description: "Tulip-waist shorts with a sweet bow detail, cut from breathable cotton twill for all-day comfort."
  },
  {
    id: "hd-g07",
    name: "Printed Sweatshirt - Blush Pink & Stone Beige",
    category: "Sweatshirt",
    subCategory: "Sweatshirts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 22,
    originalPrice: 28,
    rating: 4.9,
    reviewCount: 139,
    sku: "HD-GIR-SW-01",
    inStock: true,
    stockCount: 23,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1544441893-675973e31985.jpg",
      "/images/photo-1519457431-44ccd64a579b.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Stone Beige", hex: "#D8CDBC" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Snuggly crewneck with a tonal heart embroidery, cut from brushed cotton fleece with ribbed trims."
  },
  {
    id: "hd-g08",
    name: "Printed Sweatshirt - Rainbow Cream & Pastel Mix",
    category: "Sweatshirt",
    subCategory: "Sweatshirts",
    badge: "Trending",
    badgeType: "hot",
    price: 21,
    originalPrice: 27,
    rating: 4.8,
    reviewCount: 91,
    sku: "HD-GIR-SW-02",
    inStock: true,
    stockCount: 19,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1560243563-062bfc001d68.jpg",
      "/images/photo-1503919545889-aef636e10ad4.jpg"
    ],
    colors: [
      { name: "Rainbow Cream", hex: "#F2E3E0" },
      { name: "Pastel Mix", hex: "#DDC6E0" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Cheerful rainbow-stripe sweatshirt in soft French terry with a relaxed, comfy fit."
  },
  {
    id: "hd-g09",
    name: "Printed Hoodie - Lilac & Cream",
    category: "Hoodie",
    subCategory: "Hoodies",
    badge: "Trending",
    badgeType: "hot",
    price: 24,
    originalPrice: 31,
    rating: 4.8,
    reviewCount: 96,
    sku: "HD-GIR-HD-01",
    inStock: true,
    stockCount: 21,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1519457431-44ccd64a579b.jpg",
      "/images/photo-1544441893-675973e31985.jpg"
    ],
    colors: [
      { name: "Lilac", hex: "#B7A6D9" },
      { name: "Cream", hex: "#F5EFE0" },
      { name: "Blush", hex: "#D99A9A" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Cloud-print zip hoodie in brushed fleece with a drawcord hood and cozy kangaroo pocket."
  },
  {
    id: "hd-g10",
    name: "Girls Pullover Hoodie",
    category: "Hoodie",
    subCategory: "Hoodies",
    badge: "New Drop",
    badgeType: "new",
    price: 25,
    originalPrice: 32,
    rating: 4.9,
    reviewCount: 84,
    sku: "HD-GIR-HD-02",
    inStock: true,
    stockCount: 17,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1758782213532-bbb5fd89885e.jpg",
      "/images/photo-1746386914795-83d2febc9a96.jpg"
    ],
    colors: [
      { name: "Blush Pink", hex: "#D99A9A" },
      { name: "Powder Blue", hex: "#A9C4D8" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Ultra-soft oversized pullover hoodie in plush brushed fleece with dropped shoulders for a relaxed drape."
  },
  {
    id: "hd-g11",
    name: "Girls Casual Top - Ice Pink & Mint",
    category: "Pyjama Set",
    subCategory: "Casual Wear",
    badge: "Best Seller",
    badgeType: "hot",
    price: 26,
    originalPrice: 34,
    rating: 4.9,
    reviewCount: 127,
    sku: "HD-GIR-NW-01",
    inStock: true,
    stockCount: 25,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1746386914795-83d2febc9a96.jpg",
      "/images/photo-1763089402370-fb496fefdbb0.jpg"
    ],
    colors: [
      { name: "Ice Pink", hex: "#E8C4D0" },
      { name: "Mint", hex: "#B9D6C4" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Sweet two-piece pyjama set with satin piped trim and flutter sleeves. Buttery-soft cotton for dreamy sleep."
  },
  {
    id: "hd-g12",
    name: "Girls Casual Top - Oatmeal & Dusty Grey",
    category: "Pyjama Set",
    subCategory: "Casual Wear",
    badge: "New Drop",
    badgeType: "new",
    price: 24,
    originalPrice: 30,
    rating: 4.8,
    reviewCount: 88,
    sku: "HD-GIR-NW-02",
    inStock: true,
    stockCount: 22,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1763089402370-fb496fefdbb0.jpg",
      "/images/photo-1758782213532-bbb5fd89885e.jpg"
    ],
    colors: [
      { name: "Oatmeal", hex: "#ECE6DA" },
      { name: "Dusty Grey", hex: "#9B978F" }
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Cozy nightwear set with a relaxed tee and cuffed pants, garment-washed for cloud-soft comfort."
  },
  {
    id: "hd-g13",
    name: "Girls Party Gown",
    category: "Gown",
    subCategory: "Long Gown",
    badge: "Limited",
    badgeType: "hot",
    price: 38,
    originalPrice: 48,
    rating: 4.9,
    reviewCount: 76,
    sku: "HD-GIR-LG-01",
    inStock: true,
    stockCount: 14,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1544441893-675973e31985.jpg",
      "/images/photo-1756483492198-8ca91227489b.jpg"
    ],
    colors: [
      { name: "Ivory", hex: "#FAF8F2" },
      { name: "Dusty Pink", hex: "#D9B4AC" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    description: "Elegant long gown with a delicate lace collar, smocked back and gently flared floor-sweeping skirt."
  },
  {
    id: "hd-g14",
    name: "Girls Party Gown - Blush & Champagne",
    category: "Gown",
    subCategory: "Long Gown",
    badge: "New Drop",
    badgeType: "new",
    price: 42,
    originalPrice: 54,
    rating: 4.8,
    reviewCount: 69,
    sku: "HD-GIR-LG-02",
    inStock: true,
    stockCount: 12,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1758782213532-bbb5fd89885e.jpg",
      "/images/photo-1519457431-44ccd64a579b.jpg"
    ],
    colors: [
      { name: "Blush", hex: "#D99A9A" },
      { name: "Champagne", hex: "#E8DFC8" }
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    description: "Party-ready tulle gown with a satin bodice, full twirl skirt and hidden soft cotton lining."
  }
];

/**
 * BABIES_PRODUCTS
 * Dedicated catalog for the Babies' category page. Covers every Babies'
 * subcategory — Romper, T-shirt, Babies Pyjama, Sweatshirts, Babies Hoodies
 * and Babies Bottoms.
 */
const BABIES_PRODUCTS = [
  {
    id: "hd-bab01",
    name: "Baby Cotton Romper",
    category: "Romper",
    subCategory: "Romper",
    badge: "Best Seller",
    badgeType: "hot",
    price: 18,
    originalPrice: 24,
    rating: 4.9,
    reviewCount: 158,
    sku: "HD-BAB-RM-01",
    inStock: true,
    stockCount: 42,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1567401893414-76b7b1e5a7a5.jpg",
      "/images/photo-1617137968427-85924c800a22.jpg"
    ],
    colors: [
      { name: "Sage", hex: "#9EB69E" },
      { name: "Oatmeal", hex: "#ECE6DA" },
      { name: "Peach", hex: "#E8B2A2" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Snap-button cotton romper with reinforced poppers and roomy cuffs for wriggly little ones."
  },
  {
    id: "hd-bab02",
    name: "Baby Cotton Romper - Mustard & Off White",
    category: "Romper",
    subCategory: "Romper",
    badge: "Trending",
    badgeType: "hot",
    price: 19,
    originalPrice: 25,
    rating: 4.8,
    reviewCount: 112,
    sku: "HD-BAB-RM-02",
    inStock: true,
    stockCount: 35,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1617137968427-85924c800a22.jpg",
      "/images/photo-1567401893414-76b7b1e5a7a5.jpg"
    ],
    colors: [
      { name: "Mustard", hex: "#C89D3C" },
      { name: "Off White", hex: "#F3EFE4" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Plush terry knit romper with a snug hood and front pocket. Extreme softness for naptime and playtime."
  },
  {
    id: "hd-bab03",
    name: "Baby Cotton T-Shirt",
    category: "T-Shirt",
    subCategory: "T-shirt",
    badge: "Best Seller",
    badgeType: "hot",
    price: 12,
    originalPrice: 16,
    rating: 4.9,
    reviewCount: 174,
    sku: "HD-BAB-TS-01",
    inStock: true,
    stockCount: 48,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1519238263530-99bdd11df2ea.jpg",
      "/images/photo-1509631179647-0177331693ae.jpg"
    ],
    colors: [
      { name: "Sky Blue", hex: "#9BB8CC" },
      { name: "Crisp White", hex: "#F7F5EF" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "GOTS-certified organic cotton tee with a tagless neck and flat-locked seams that never rub."
  },
  {
    id: "hd-bab04",
    name: "Printed Baby T-Shirt",
    category: "T-Shirt",
    subCategory: "T-shirt",
    badge: "New Drop",
    badgeType: "new",
    price: 13,
    originalPrice: 17,
    rating: 4.8,
    reviewCount: 101,
    sku: "HD-BAB-TS-02",
    inStock: true,
    stockCount: 39,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1503342217505-b0a15ec3261c.jpg",
      "/images/photo-1487222477894-8943e31ef7b2.jpg"
    ],
    colors: [
      { name: "Blush", hex: "#D99A9A" },
      { name: "Cream", hex: "#F5EFE0" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Sweet heart-print baby tee in supersoft washed cotton, cut generously for easy on-off dressing."
  },
  {
    id: "hd-bab05",
    name: "Printed Pyjama - Grey Stripe & Blue Stripe",
    category: "Pyjama",
    subCategory: "Babies Pyjama",
    badge: "New Drop",
    badgeType: "new",
    price: 22,
    originalPrice: 28,
    rating: 4.8,
    reviewCount: 96,
    sku: "HD-BAB-PJ-01",
    inStock: true,
    stockCount: 27,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1507679799987-c73779587ccf.jpg",
      "/images/photo-1503919545889-aef636e10ad4.jpg"
    ],
    colors: [
      { name: "Grey Stripe", hex: "#9B978F" },
      { name: "Blue Stripe", hex: "#6E8CA4" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "One-piece footed fleece pyjama with a front zip and snap-free design for safe, easy night changes."
  },
  {
    id: "hd-bab06",
    name: "Baby Cotton Pyjama",
    category: "Pyjama",
    subCategory: "Babies Pyjama",
    badge: "Trending",
    badgeType: "hot",
    price: 24,
    originalPrice: 30,
    rating: 4.9,
    reviewCount: 88,
    sku: "HD-BAB-PJ-02",
    inStock: true,
    stockCount: 24,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1503919545889-aef636e10ad4.jpg",
      "/images/photo-1503342217505-b0a15ec3261c.jpg"
    ],
    colors: [
      { name: "Sage", hex: "#9EB69E" },
      { name: "Mint Stripe", hex: "#B9D6C4" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Cozy one-piece sleep sack pyjama in breathable cotton knit with gentle elasticated cuffs."
  },
  {
    id: "hd-bab07",
    name: "Baby Cotton Sweatshirt",
    category: "Sweatshirt",
    subCategory: "Sweatshirts",
    badge: "Best Seller",
    badgeType: "hot",
    price: 21,
    originalPrice: 27,
    rating: 4.8,
    reviewCount: 84,
    sku: "HD-BAB-SW-01",
    inStock: true,
    stockCount: 26,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1503341504253-dff4815485f1.jpg",
      "/images/photo-1445205170230-053b83016050.jpg"
    ],
    colors: [
      { name: "Oatmeal", hex: "#ECE6DA" },
      { name: "Sky Blue", hex: "#9BB8CC" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Quilted-style sweatshirt in double-brushed fleece with a fold-over mitt-free cuff and snap shoulder."
  },
  {
    id: "hd-bab08",
    name: "Baby Pullover Hoodie",
    category: "Hoodie",
    subCategory: "Babies Hoodies",
    badge: "New Drop",
    badgeType: "new",
    price: 25,
    originalPrice: 32,
    rating: 4.8,
    reviewCount: 92,
    sku: "HD-BAB-HD-01",
    inStock: true,
    stockCount: 21,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1567401893414-76b7b1e5a7a5.jpg",
      "/images/photo-1617137968427-85924c800a22.jpg"
    ],
    colors: [
      { name: "Teddy Brown", hex: "#B98C62" },
      { name: "Blush", hex: "#D99A9A" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Plush teddy-fleece hoodie with a soft-lining hood, snap-front closure and cozy ribbed trims."
  },
  {
    id: "hd-bab09",
    name: "Baby Zip-Up Hoodie",
    category: "Hoodie",
    subCategory: "Babies Hoodies",
    badge: "Trending",
    badgeType: "hot",
    price: 24,
    originalPrice: 30,
    rating: 4.7,
    reviewCount: 76,
    sku: "HD-BAB-HD-02",
    inStock: true,
    stockCount: 23,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    images: [
      "/images/photo-1617137968427-85924c800a22.jpg",
      "/images/photo-1503342217505-b0a15ec3261c.jpg"
    ],
    colors: [
      { name: "Navy", hex: "#1D2B3A" },
      { name: "Charcoal", hex: "#2C2B27" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Easy zip-front baby hoodie in brushed French terry with a cozy hood and chunky safe zipper."
  },
  {
    id: "hd-bab10",
    name: "Baby Cotton Pants",
    category: "Bottoms",
    subCategory: "Babies Bottoms",
    badge: "Best Seller",
    badgeType: "hot",
    price: 14,
    originalPrice: 18,
    rating: 4.8,
    reviewCount: 121,
    sku: "HD-BAB-BT-01",
    inStock: true,
    stockCount: 44,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    images: [
      "/images/photo-1445205170230-053b83016050.jpg",
      "/images/photo-1503341504253-dff4815485f1.jpg"
    ],
    colors: [
      { name: "Beige", hex: "#D8CDBC" },
      { name: "Heather Grey", hex: "#8A8680" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Soft pull-on bottoms with a gentle elastic waist and ribbed ankle cuffs for a secure, comfy fit."
  },
  {
    id: "hd-bab11",
    name: "Baby Joggers",
    category: "Bottoms",
    subCategory: "Babies Bottoms",
    badge: "New Drop",
    badgeType: "new",
    price: 15,
    originalPrice: 19,
    rating: 4.8,
    reviewCount: 87,
    sku: "HD-BAB-BT-02",
    inStock: true,
    stockCount: 31,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    images: [
      "/images/photo-1503341504253-dff4815485f1.jpg",
      "/images/photo-1490481651871-ab68de25d43d.jpg"
    ],
    colors: [
      { name: "Oatmeal", hex: "#ECE6DA" },
      { name: "Olive", hex: "#4B5A3F" }
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    description: "Brushed knit pants with cuffed ankles and a soft wide waistband — made for crawling and first steps."
  }
];

/**
 * Normalizes any product from the catalog with standard properties:
 * category (men|women|kids), productType, isBestSeller, isNewArrival, color, sizes, price, originalPrice, createdAt
 */
function normalizeProduct(p, sourceCategory = null) {
  let category = sourceCategory;
  if (!category) {
    if (p.id.startsWith("hd-m") || (p.sku && p.sku.includes("-MEN-")) || p.id === "hd-001" || p.id === "hd-004" || p.id === "hd-008") {
      category = "mens";
    } else if (p.id.startsWith("hd-w") || (p.sku && (p.sku.includes("-WOM-") || p.sku.includes("-DRS-") || p.sku.includes("-ETH-") || p.sku.includes("-SKT-"))) || p.id === "hd-002" || p.id === "hd-003" || p.id === "hd-005" || p.id === "hd-007") {
      category = "women";
    } else if (p.id.startsWith("hd-b") || (p.sku && p.sku.includes("-KID-BY-"))) {
      category = "boys";
    } else if (p.id.startsWith("hd-g") || (p.sku && p.sku.includes("-KID-GL-"))) {
      category = "girls";
    } else if (p.id.startsWith("hd-bab") || (p.sku && p.sku.includes("-BAB-"))) {
      category = "babies";
    } else if (p.id.startsWith("hd-k") || (p.sku && p.sku.includes("-KID-")) || p.id === "hd-006") {
      category = "kids";
    } else {
      category = "mens";
    }
  }

  // Standardize productType
  let productType = "T-Shirts";
  const cat = (p.category || "").toLowerCase();
  const sub = (p.subCategory || "").toLowerCase();
  const name = (p.name || "").toLowerCase();

  if (cat.includes("hoodie") || sub.includes("hoodie") || name.includes("hoodie")) {
    productType = "Hoodies";
  } else if (cat.includes("sweatshirt") || sub.includes("sweatshirt") || name.includes("sweatshirt")) {
    productType = "Sweatshirts";
  } else if (cat.includes("jogger") || sub.includes("jogger") || name.includes("jogger")) {
    productType = "Joggers";
  } else if (cat.includes("polo") || sub.includes("polo") || name.includes("polo")) {
    productType = "Polos";
  } else if (cat.includes("co-ord") || sub.includes("co-ord") || name.includes("co-ord")) {
    productType = "Co-ords";
  } else if (cat.includes("dress") || sub.includes("dress") || cat.includes("saree") || name.includes("dress") || name.includes("saree")) {
    productType = "Dresses";
  } else if (cat.includes("skirt") || name.includes("skirt")) {
    productType = "Skirts";
  } else if (name.includes("blazer") || cat.includes("blazer")) {
    productType = "Blazers";
  } else if (cat.includes("set") || name.includes("set") || cat.includes("romper") || name.includes("romper")) {
    productType = "Sets";
  } else if (name.includes("shirt") && !name.includes("t-shirt") && !name.includes("tee")) {
    productType = "Shirts";
  } else {
    productType = "T-Shirts";
  }

  const isBestSeller = Boolean(
    p.isBestSeller ||
    (p.badge && p.badge.toLowerCase().includes("best")) ||
    p.badgeType === "hot"
  );

  const isNewArrival = Boolean(
    p.isNew ||
    (p.badge && (p.badge.toLowerCase().includes("new") || p.badge.toLowerCase().includes("drop"))) ||
    p.badgeType === "new"
  );

  return {
    ...p,
    category,
    productType,
    isBestSeller,
    isNewArrival,
    isNew: isNewArrival,
    color: p.colors || [],
    sizes: p.sizes || ["S", "M", "L", "XL"],
    price: p.price,
    originalPrice: p.originalPrice || null,
    createdAt: p.releaseDate || (p.createdAt ?? new Date(Date.now() - (parseInt((p.id || "1").replace(/\D/g, "") || "1", 10) * 86400000 * 2)).toISOString())
  };
}

/**
 * Single unified product catalog for the entire HooDee Daddy store.
 * Merges MEN_PRODUCTS, WOMEN_PRODUCTS, BOYS_PRODUCTS, GIRLS_PRODUCTS,
 * KIDS_PRODUCTS, BABIES_PRODUCTS and PRODUCTS without duplicating any item.
 */
const UNIFIED_PRODUCTS = (() => {
  const seen = new Set();
  const list = [];

  const sources = [
    { items: MEN_PRODUCTS, cat: "mens" },
    { items: WOMEN_PRODUCTS, cat: "women" },
    { items: BOYS_PRODUCTS, cat: "boys" },
    { items: GIRLS_PRODUCTS, cat: "girls" },
    { items: KIDS_PRODUCTS, cat: "kids" },
    { items: BABIES_PRODUCTS, cat: "babies" },
    { items: PRODUCTS, cat: null }
  ];

  sources.forEach(({ items, cat }) => {
    items.forEach((p) => {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        let sourceCategory = cat;
        if (!sourceCategory) {
          if (p.sku && p.sku.includes("-KID-BY-")) sourceCategory = "boys";
          else if (p.sku && p.sku.includes("-KID-GL-")) sourceCategory = "girls";
          else if (p.sku && p.sku.includes("-BAB-")) sourceCategory = "babies";
          else if (p.id.startsWith("hd-bab")) sourceCategory = "babies";
          else if (p.id.startsWith("hd-b")) sourceCategory = "boys";
          else if (p.id.startsWith("hd-g")) sourceCategory = "girls";
          else if (p.id.startsWith("hd-k")) sourceCategory = "kids";
        }
        list.push(normalizeProduct(p, sourceCategory));
      }
    });
  });

  return list;
})();
module.exports = { UNIFIED_PRODUCTS, MEN_SUBCATEGORIES, WOMEN_SUBCATEGORIES, KIDS_SUBCATEGORIES, BOYS_SUBCATEGORIES, GIRLS_SUBCATEGORIES, BABIES_SUBCATEGORIES, COLLECTIONS_DATA };
