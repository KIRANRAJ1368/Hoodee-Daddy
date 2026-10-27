/**
 * Seed Complete Clean Catalog for ZMW:
 * - Cleans old products, variants, colors, sizes, reviews, and subcategories
 * - Ensures 5 Core Categories: Men (mens), Women (women), Babies (babies), Girls (girls), Boys (boys)
 * - Adds 3 clean, dedicated Subcategories for each category
 * - Adds exactly 3 realistic, luxury products for each subcategory (45 products total)
 * - Adds unique Colors (with hex codes) and category-appropriate Sizes for every product
 * - Generates full Variant Matrix with SKU suffixes and stock counts
 * - Generates 2-3 authentic, verified customer reviews for each product and recalculates ratings
 */

const {
  sequelize,
  Category,
  Subcategory,
  Product,
  ProductVariant,
  ProductColor,
  ProductSize,
  ProductImage,
  Review,
  OrderItem,
  Offer
} = require("../src/models");

const CATALOG_DATA = [
  // ── 1. MEN ────────────────────────────────────────────────────────────
  {
    categorySlug: "mens",
    categoryName: "Men",
    subcategories: [
      {
        name: "Oversized Streetwear Tees",
        slug: "oversized-streetwear-tees",
        image: "/images/cat-men-round-neck.jpg",
        products: [
          {
            name: "HooDee Daddy Atelier Heavyweight Oversized Tee",
            slug: "hd-atelier-heavyweight-oversized-tee",
            sku: "HD-M-TEE-01",
            price: 999,
            original_price: 1699,
            badge_label: "Best Seller",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "Engineered from 260 GSM pure combed cotton with a structured drop-shoulder drape and reinforced collar. Pre-shrunk and bio-washed for lasting softness.",
            specifications: [
              { title: "FABRIC", value: "100% Pure Combed Cotton (260 GSM)" },
              { title: "SILHOUETTE", value: "Boxy Oversized Regular Fit" },
              { title: "COLLAR", value: "1.25\" Thick Ribbed Neckband" },
              { title: "CARE", value: "Cold Machine Wash, Tumble Dry Low" }
            ],
            colors: [
              { name: "Midnight Obsidian", hex_code: "#111827" },
              { name: "Vintage Cream", hex_code: "#FDFBF7" }
            ],
            sizes: ["S", "M", "L", "XL", "XXL"],
            images: ["/images/hero-mens-oversized-tee.jpg", "/images/hero-mens-tshirt-banner-2.jpg"],
            reviews: [
              { name: "Praveen Kumar", rating: 5, title: "Unbeatable Fabric Quality", comment: "The 260 GSM fabric has substantial weight and hangs perfectly without clinging. Zero shrinkage after 3 washes." },
              { name: "Arun V.", rating: 5, title: "Best drop-shoulder tee in India", comment: "The rib collar holds its shape all day. Luxury packaging and swift delivery." }
            ]
          },
          {
            name: "HooDee Daddy Gothic Arch Graphic Acid-Wash Tee",
            slug: "hd-gothic-arch-graphic-acid-wash-tee",
            sku: "HD-M-TEE-02",
            price: 1099,
            original_price: 1899,
            badge_label: "New Season",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "Features custom distressed gothic typographic artwork on 280 GSM mineral-washed heavyweight jersey. Raw-edge aesthetics meet atelier craftsmanship.",
            specifications: [
              { title: "FABRIC", value: "Mineral Washed Cotton (280 GSM)" },
              { title: "PRINT", value: "High-Density Discharge Silkscreen" },
              { title: "FIT", value: "Relaxed Boxy Streetwear Cut" },
              { title: "ORIGIN", value: "Crafted in Tirupur Atelier" }
            ],
            colors: [
              { name: "Washed Charcoal", hex_code: "#374151" },
              { name: "Vintage Olive", hex_code: "#4B5320" }
            ],
            sizes: ["M", "L", "XL", "XXL"],
            images: ["/images/hero-mens-tshirt-banner-3.jpg", "/images/banner-streetwear-tee.jpg"],
            reviews: [
              { name: "Vikram Rathod", rating: 5, title: "Outstanding vintage wash", comment: "The acid wash texture is authentic and subtle. Very comfortable for daily wear." },
              { name: "Karthik Raja", rating: 4, title: "Heavy and durable", comment: "Thick cotton, great graphics. Size down if you prefer a standard fit." }
            ]
          },
          {
            name: "HooDee Daddy Minimalist Embroidered Crest Tee",
            slug: "hd-minimalist-embroidered-crest-tee",
            sku: "HD-M-TEE-03",
            price: 899,
            original_price: 1499,
            badge_label: "Essential",
            badge_type: "new",
            is_best_seller: true,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "Subtle high-density micro-crest embroidery on chest. Cut from 240 GSM ultra-soft combed cotton for everyday understated luxury.",
            specifications: [
              { title: "FABRIC", value: "240 GSM Bio-Washed Combed Cotton" },
              { title: "DETAIL", value: "Tonal Satin Micro-Embroidery" },
              { title: "STITCHING", value: "Double-Needle Flatlock Seams" },
              { title: "WASH", value: "Colorfast Anti-Fade Finish" }
            ],
            colors: [
              { name: "Pure Chalk White", hex_code: "#F8FAFC" },
              { name: "Deep Navy", hex_code: "#0F172A" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-men-round-neck.jpg", "/images/dept-mens.jpg"],
            reviews: [
              { name: "Suresh Mani", rating: 5, title: "Clean and elegant", comment: "Subtle crest embroidery looks very premium. Perfect under a chore coat or open overshirt." }
            ]
          }
        ]
      },
      {
        name: "Heavyweight Cotton Hoodies",
        slug: "heavyweight-cotton-hoodies",
        image: "/images/cat-men-hoodie.jpg",
        products: [
          {
            name: "HooDee Daddy Signature 450 GSM Boxy Pullover Hoodie",
            slug: "hd-signature-450-gsm-boxy-pullover-hoodie",
            sku: "HD-M-HOD-01",
            price: 1999,
            original_price: 3299,
            badge_label: "Winter Drop",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Hoodies",
            description: "Our flagship 450 GSM French Terry hoodie. Seamless double-layer hood without drawstrings for a clean architectural silhouette, finished with kangaroo pocket.",
            specifications: [
              { title: "FABRIC", value: "450 GSM 100% Cotton French Terry" },
              { title: "HOOD", value: "Double-Layer Clean Structural Hood" },
              { title: "CUFFS", value: "Heavy 2x2 Spandex Ribbed Cuffs" },
              { title: "FIT", value: "Oversized Boxy with Dropped Shoulders" }
            ],
            colors: [
              { name: "Pitch Black", hex_code: "#0A0A0A" },
              { name: "Heather Grey", hex_code: "#9CA3AF" }
            ],
            sizes: ["S", "M", "L", "XL", "XXL"],
            images: ["/images/banner-streetwear-hoodie.jpg", "/images/cat-men-hoodie.jpg"],
            reviews: [
              { name: "Dinesh S.", rating: 5, title: "Heaviest hoodie I own", comment: "The hood stands up on its own without drawstrings. Keeps you warm and looks razor sharp." },
              { name: "Aditya Nair", rating: 5, title: "Worth every rupee", comment: "Pure heavyweight luxury. Feels like high-end European streetwear." }
            ]
          },
          {
            name: "HooDee Daddy Vintage Washed Zip-Up Fleece Jacket",
            slug: "hd-vintage-washed-zip-up-fleece-jacket",
            sku: "HD-M-HOD-02",
            price: 2199,
            original_price: 3499,
            badge_label: "Limited Drop",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Hoodies",
            description: "Constructed with 420 GSM brushed inner fleece, antique brass heavy YKK two-way zipper, and hand-distressed ribbed hem.",
            specifications: [
              { title: "FABRIC", value: "420 GSM Brushed Fleece Lining" },
              { title: "HARDWARE", value: "Antique Brass Two-Way YKK Zipper" },
              { title: "POCKETS", value: "Deep Split-Kangaroo Handwarmers" },
              { title: "FINISH", value: "Enzyme Softened Wash" }
            ],
            colors: [
              { name: "Forest Moss", hex_code: "#2D3748" },
              { name: "Mocha Brown", hex_code: "#4A3B32" }
            ],
            sizes: ["M", "L", "XL"],
            images: ["/images/banner-streetwear-jacket.jpg", "/images/cat-men-hoodie.jpg"],
            reviews: [
              { name: "Raghav M.", rating: 5, title: "Great zipper and fleece warmth", comment: "Two-way zipper allows easy styling. Warm fleece inside is super soft against skin." }
            ]
          },
          {
            name: "HooDee Daddy Raw Hem Relaxed Crewneck Sweatshirt",
            slug: "hd-raw-hem-relaxed-crewneck-sweatshirt",
            sku: "HD-M-HOD-03",
            price: 1699,
            original_price: 2799,
            badge_label: "Minimal",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sweatshirts",
            description: "380 GSM cotton fleece crewneck featuring subtle distressed raw-edge cuff details and relaxed tailored fit for easy winter layering.",
            specifications: [
              { title: "FABRIC", value: "380 GSM Diagonal Loop French Terry" },
              { title: "COLLAR", value: "Reinforced Stretch Ribbed Neck" },
              { title: "FIT", value: "Relaxed Everyday Cut" },
              { title: "ORIGIN", value: "Atelier Handcrafted" }
            ],
            colors: [
              { name: "Bone White", hex_code: "#F1F5F9" },
              { name: "Washed Navy", hex_code: "#1E293B" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-men-hoodie.jpg", "/images/dept-mens.jpg"],
            reviews: [
              { name: "Gautam K.", rating: 5, title: "Perfect everyday layer", comment: "Comfortable diagonal loop interior. Not too hot for indoor AC offices." }
            ]
          }
        ]
      },
      {
        name: "Relaxed Fit Cargo Trousers",
        slug: "relaxed-fit-cargo-trousers",
        image: "/images/cat-banner-mens.jpg",
        products: [
          {
            name: "HooDee Daddy Tactical Utility Multi-Pocket Cargo Pant",
            slug: "hd-tactical-utility-multi-pocket-cargo-pant",
            sku: "HD-M-TR-01",
            price: 1799,
            original_price: 2999,
            badge_label: "Trending",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Trousers",
            description: "Heavy 320 GSM cotton twill tactical pant featuring 6 ergonomic utility pockets, articulated knee darts, and adjustable toggle drawcords at hems.",
            specifications: [
              { title: "FABRIC", value: "320 GSM 100% Cotton Structured Twill" },
              { title: "POCKETS", value: "6 Functional Cargo & Welt Pockets" },
              { title: "WAIST", value: "Elasticated Back with Belt Loops" },
              { title: "HEM", value: "Adjustable Bungee Cord Cuffs" }
            ],
            colors: [
              { name: "Military Olive", hex_code: "#3B4D3C" },
              { name: "Shadow Black", hex_code: "#18181B" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-banner-mens.jpg", "/images/dept-mens.jpg"],
            reviews: [
              { name: "Vijay Anand", rating: 5, title: "Incredible cargo trousers", comment: "High quality twill fabric. Pockets are roomy without looking bulky." }
            ]
          },
          {
            name: "HooDee Daddy Pleated Wide-Leg Tailored Trouser",
            slug: "hd-pleated-wide-leg-tailored-trouser",
            sku: "HD-M-TR-02",
            price: 1899,
            original_price: 3199,
            badge_label: "New Cut",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Trousers",
            description: "Double front pleats with a graceful wide-leg drape. Designed for contemporary relaxed sartorial dressing.",
            specifications: [
              { title: "FABRIC", value: "Structured Cotton-Viscose Blend" },
              { title: "PLEATS", value: "Double Inward-Facing Front Pleats" },
              { title: "CLOSURE", value: "Concealed YKK Zip & Hook Bar" },
              { title: "FIT", value: "Wide Leg Relaxed Drape" }
            ],
            colors: [
              { name: "Charcoal Grey", hex_code: "#475569" },
              { name: "Warm Khaki", hex_code: "#A8A29E" }
            ],
            sizes: ["M", "L", "XL"],
            images: ["/images/cat-banner-mens.jpg", "/images/dept-mens.jpg"],
            reviews: [
              { name: "Manoj R.", rating: 5, title: "Modern tailored silhouette", comment: "Falls beautifully over loafers or chunky sneakers. Very premium material." }
            ]
          },
          {
            name: "HooDee Daddy Daily Elastic-Waist Easy Chino Pant",
            slug: "hd-daily-elastic-waist-easy-chino-pant",
            sku: "HD-M-TR-03",
            price: 1499,
            original_price: 2499,
            badge_label: "Essential",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "Chinos",
            description: "Pre-washed stretch cotton twill with an internal drawstring and elasticated waistband for effortless all-day ease.",
            specifications: [
              { title: "FABRIC", value: "98% Cotton, 2% Spandex Stretch Twill" },
              { title: "WAIST", value: "Encased Elastic with Flat Cord" },
              { title: "POCKETS", value: "Deep Slash Pockets + Buttoned Rear" },
              { title: "CARE", value: "Machine Wash Warm" }
            ],
            colors: [
              { name: "Navy Ink", hex_code: "#1E293B" },
              { name: "Desert Sand", hex_code: "#D6D3D1" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-banner-mens.jpg", "/images/dept-mens.jpg"],
            reviews: [
              { name: "Deepak S.", rating: 5, title: "Comfortable for all day wear", comment: "Stretch twill makes sitting and traveling effortless. Will buy another color." }
            ]
          }
        ]
      }
    ]
  },

  // ── 2. WOMEN ──────────────────────────────────────────────────────────
  {
    categorySlug: "women",
    categoryName: "Women",
    subcategories: [
      {
        name: "Graphic Boxy Tees",
        slug: "graphic-boxy-tees",
        image: "/images/cat-women-tees.jpg",
        products: [
          {
            name: "HooDee Daddy Women's Celestial Aura Boxy Cropped Tee",
            slug: "hd-womens-celestial-aura-boxy-cropped-tee",
            sku: "HD-W-TEE-01",
            price: 849,
            original_price: 1499,
            badge_label: "Trending",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "Crafted from 220 GSM bio-washed pure cotton with a flattering boxy silhouette and celestial gold foil accents.",
            specifications: [
              { title: "FABRIC", value: "220 GSM 100% Combed Cotton" },
              { title: "LENGTH", value: "Modest Cropped Boxy Cut" },
              { title: "PRINT", value: "Water-based Soft Breathable Ink" },
              { title: "FEEL", value: "Feather-Soft Bio-Polished Surface" }
            ],
            colors: [
              { name: "Chalk Ecru", hex_code: "#FDFBF7" },
              { name: "Dusty Terracotta", hex_code: "#A65B44" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-women-tees.jpg", "/images/cat-women-round-neck.jpg"],
            reviews: [
              { name: "Sneha Menon", rating: 5, title: "Flattering cut and super soft", comment: "The boxy cropped silhouette pairs perfectly with high-waisted linen pants. Love the soft cotton!" },
              { name: "Divya N.", rating: 5, title: "Gorgeous color and drape", comment: "The Terracotta color is even prettier in person. Doesn't shrink in wash." }
            ]
          },
          {
            name: "HooDee Daddy Minimalist Linear Typography Relaxed Tee",
            slug: "hd-minimalist-linear-typography-relaxed-tee",
            sku: "HD-W-TEE-02",
            price: 799,
            original_price: 1399,
            badge_label: "Everyday",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "Understated line typography across the chest. Drop shoulder seams provide effortless chic styling.",
            specifications: [
              { title: "FABRIC", value: "240 GSM Combed Ring-Spun Cotton" },
              { title: "SEAMS", value: "Reinforced Bound Collar" },
              { title: "FIT", value: "Relaxed Slouchy Silhouette" },
              { title: "CARE", value: "Gentle Cold Machine Wash" }
            ],
            colors: [
              { name: "Sage Mist", hex_code: "#9CAF88" },
              { name: "Midnight Black", hex_code: "#111827" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-women-round-neck.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Ananya Sharma", rating: 5, title: "Perfect everyday essential", comment: "The Sage Mist color is very aesthetic. Great fabric thickness." }
            ]
          },
          {
            name: "HooDee Daddy Vintage Sun-Faded Heavyweight Boyfriend Tee",
            slug: "hd-vintage-sun-faded-heavyweight-boyfriend-tee",
            sku: "HD-W-TEE-03",
            price: 899,
            original_price: 1599,
            badge_label: "Vintage Drop",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "250 GSM heavy cotton tee washed with natural enzymes for a relaxed broken-in feel and sun-faded vintage hue.",
            specifications: [
              { title: "FABRIC", value: "250 GSM Pure Cotton Single Jersey" },
              { title: "WASH", value: "Enzyme Sun-Faded Mineral Tint" },
              { title: "FIT", value: "Oversized Boyfriend Drop" },
              { title: "ORIGIN", value: "Crafted in Atelier" }
            ],
            colors: [
              { name: "Washed Slate", hex_code: "#475569" },
              { name: "Rose Quartz", hex_code: "#F7CAC9" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-women-v-neck.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Kavitha S.", rating: 5, title: "Super comfy boyfriend fit", comment: "Heavyweight without feeling stiff. Great for lounge or street wear." }
            ]
          }
        ]
      },
      {
        name: "Cropped Hoodies & Sweaters",
        slug: "cropped-hoodies-sweaters",
        image: "/images/cat-women-hoodie.jpg",
        products: [
          {
            name: "HooDee Daddy Women's Cloud-Soft Cropped Pullover Hoodie",
            slug: "hd-womens-cloud-soft-cropped-pullover-hoodie",
            sku: "HD-W-HOD-01",
            price: 1799,
            original_price: 2999,
            badge_label: "Best Seller",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Hoodies",
            description: "400 GSM brushed fleece with a plush velour interior finish. Modest cropped hem with a wide ribbed waistband.",
            specifications: [
              { title: "FABRIC", value: "400 GSM Ultra-Soft Brushed Cotton Fleece" },
              { title: "HOOD", value: "Crossover Double Lined Cozy Hood" },
              { title: "WAIST", value: "Flattering 3-Inch Ribbed Waistband" },
              { title: "FIT", value: "Cropped Relaxed Comfort" }
            ],
            colors: [
              { name: "Oatmeal Heather", hex_code: "#E5E7EB" },
              { name: "Muted Mauve", hex_code: "#9B7283" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-women-hoodie.jpg", "/images/banner-womens.jpg"],
            reviews: [
              { name: "Pooja V.", rating: 5, title: "Literally cloud soft", comment: "So cozy! The interior fleece is velvety soft. Looks stunning with sweatpants." }
            ]
          },
          {
            name: "HooDee Daddy Chunky Ribbed Mock-Neck Knit Sweater",
            slug: "hd-chunky-ribbed-mock-neck-knit-sweater",
            sku: "HD-W-HOD-02",
            price: 1999,
            original_price: 3299,
            badge_label: "Winter Drop",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sweaters",
            description: "Substantial cotton-blend yarn in a distinctive fisherman ribbed pattern. Non-itchy, breathable, and wonderfully warm.",
            specifications: [
              { title: "FABRIC", value: "100% Breathable Combed Cotton Knit" },
              { title: "NECK", value: "Warm Ribbed Mock Neck" },
              { title: "STITCH", value: "7-Gauge Chunky Fisherman Rib" },
              { title: "CARE", value: "Dry Flat in Shade" }
            ],
            colors: [
              { name: "Cream Butter", hex_code: "#FFFDD0" },
              { name: "Mocha Taupe", hex_code: "#8B7355" }
            ],
            sizes: ["S", "M", "L"],
            images: ["/images/cat-women-hoodie.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Meera K.", rating: 5, title: "Zero itchiness, pure warmth", comment: "Finding 100% cotton knitwear that doesn't itch is rare. This sweater is phenomenal." }
            ]
          },
          {
            name: "HooDee Daddy Oversized Half-Zip Loungewear Sweatshirt",
            slug: "hd-oversized-half-zip-loungewear-sweatshirt",
            sku: "HD-W-HOD-03",
            price: 1699,
            original_price: 2799,
            badge_label: "Comfort Fit",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sweatshirts",
            description: "380 GSM French Terry sweatshirt with a silver ring zipper pull and slouchy dropped shoulders for elevated lounge aesthetics.",
            specifications: [
              { title: "FABRIC", value: "380 GSM Diagonal French Terry" },
              { title: "ZIPPER", value: "Antique Silver Tone Half Zipper" },
              { title: "HEM", value: "Relaxed Open Hem with Side Vents" },
              { title: "FIT", value: "Oversized Slouchy Comfort" }
            ],
            colors: [
              { name: "Forest Sage", hex_code: "#556B2F" },
              { name: "Obsidian Black", hex_code: "#18181B" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-women-hoodie.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Shalini R.", rating: 5, title: "Chic and sporty", comment: "The half-zip styling looks elevated over activewear or jeans." }
            ]
          }
        ]
      },
      {
        name: "Flowy Linen & Cotton Pants",
        slug: "flowy-linen-cotton-pants",
        image: "/images/cat-banner-womens.jpg",
        products: [
          {
            name: "HooDee Daddy Wide-Leg Cotton Linen Drawstring Trouser",
            slug: "hd-wide-leg-cotton-linen-drawstring-trouser",
            sku: "HD-W-TR-01",
            price: 1599,
            original_price: 2699,
            badge_label: "Best Seller",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Trousers",
            description: "Blended pure flax linen and cotton for a soft, breathable drape that moves gracefully with every step. Deep functional pockets.",
            specifications: [
              { title: "FABRIC", value: "55% Flax Linen, 45% Organic Cotton" },
              { title: "WAIST", value: "Wide Elastic Waistband with Linen Tie" },
              { title: "LEG", value: "Relaxed Wide-Leg Flowy Drape" },
              { title: "POCKETS", value: "Side Slash Pockets" }
            ],
            colors: [
              { name: "Natural Flax", hex_code: "#E5DEC9" },
              { name: "Olive Tint", hex_code: "#708238" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-banner-womens.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Anita S.", rating: 5, title: "Breezy and elegant", comment: "So comfortable in warm weather. Does not wrinkle aggressively like cheap linen." }
            ]
          },
          {
            name: "HooDee Daddy High-Waisted Relaxed Cargo Jogger",
            slug: "hd-high-waisted-relaxed-cargo-jogger",
            sku: "HD-W-TR-02",
            price: 1699,
            original_price: 2899,
            badge_label: "Streetwear",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Trousers",
            description: "Structured cotton poplin jogger with high-rise smocked waistband, low-profile utility cargo flaps, and gathered elastic ankles.",
            specifications: [
              { title: "FABRIC", value: "100% Crisp Washed Cotton Poplin" },
              { title: "RISE", value: "High-Rise Comfort Smocked Waist" },
              { title: "POCKETS", value: "Streamlined Flap Cargo Pockets" },
              { title: "ANKLES", value: "Gathered Soft Elastic Rib" }
            ],
            colors: [
              { name: "Sand Dune", hex_code: "#D2B48C" },
              { name: "Carbon Black", hex_code: "#18181B" }
            ],
            sizes: ["S", "M", "L"],
            images: ["/images/cat-banner-womens.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Tanvi P.", rating: 5, title: "Trendy and high waist fit", comment: "Fits true to size. Perfect with cropped hoodies and chunky runners." }
            ]
          },
          {
            name: "HooDee Daddy Classic Straight-Leg Everyday Chino Pant",
            slug: "hd-classic-straight-leg-everyday-chino-pant",
            sku: "HD-W-TR-03",
            price: 1499,
            original_price: 2499,
            badge_label: "Essential",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "Chinos",
            description: "Clean tailored lines with a hint of stretch. Suitable for workdays, weekend brunches, or travel.",
            specifications: [
              { title: "FABRIC", value: "97% Cotton, 3% Spandex Comfort Twill" },
              { title: "CUT", value: "Clean Straight Leg" },
              { title: "CLOSURE", value: "Front Zip Fly with Hook Closure" },
              { title: "CARE", value: "Machine Wash Cold" }
            ],
            colors: [
              { name: "Deep Navy", hex_code: "#0F172A" },
              { name: "Warm Biscuit", hex_code: "#E2D9C8" }
            ],
            sizes: ["S", "M", "L", "XL"],
            images: ["/images/cat-banner-womens.jpg", "/images/dept-womens.jpg"],
            reviews: [
              { name: "Gayathri M.", rating: 5, title: "Staple work pants", comment: "Fits comfortably on the waist and hip. Quality cotton twill." }
            ]
          }
        ]
      }
    ]
  },

  // ── 3. BABIES ─────────────────────────────────────────────────────────
  {
    categorySlug: "babies",
    categoryName: "Babies",
    subcategories: [
      {
        name: "Organic Cotton Snap Rompers",
        slug: "organic-cotton-snap-rompers",
        image: "/images/cat-babies-romper.jpg",
        products: [
          {
            name: "HooDee Daddy Tiny Cloud 100% Organic Cotton Snap Romper",
            slug: "hd-tiny-cloud-100-organic-cotton-snap-romper",
            sku: "HD-B-ROM-01",
            price: 599,
            original_price: 999,
            badge_label: "GOTS Certified",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Rompers",
            description: "Crafted from GOTS certified 100% organic combed cotton rib with nickel-free bottom snaps for easy diaper changes. Zero scratchy tags inside.",
            specifications: [
              { title: "CERTIFICATION", value: "GOTS Certified 100% Organic Cotton" },
              { title: "SNAPS", value: "YKK Nickel-Free Hypoallergenic Snaps" },
              { title: "TAGS", value: "Printed Tagless Neck Label" },
              { title: "SAFETY", value: "Azo-Free Baby-Safe Dyes" }
            ],
            colors: [
              { name: "Buttermilk Cream", hex_code: "#FFFDD0" },
              { name: "Sage Sprout", hex_code: "#D1E8E2" }
            ],
            sizes: ["0-3M", "3-6M", "6-12M", "12-18M"],
            images: ["/images/cat-babies-romper.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Deepa Ramakrishnan", rating: 5, title: "Extremely soft on baby skin", comment: "No redness or rashes on my newborn's skin. The nickel-free snaps make night changes effortless." },
              { name: "Lakshmi Narayanan", rating: 5, title: "High quality organic cotton", comment: "Stays buttery soft even after several baby laundry cycles. Will gift to friends." }
            ]
          },
          {
            name: "HooDee Daddy Meadow Floral Soft Kimono-Style Romper",
            slug: "hd-meadow-floral-soft-kimono-style-romper",
            sku: "HD-B-ROM-02",
            price: 649,
            original_price: 1099,
            badge_label: "Newborn Pick",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Rompers",
            description: "Gentle wrap-around kimono front eliminates pulling over baby's sensitive head. Features foldover scratch mittens for newborns.",
            specifications: [
              { title: "DESIGN", value: "Side Kimono Snap Wrap" },
              { title: "FABRIC", value: "100% Ultra-Fine Combed Interlock" },
              { title: "CUFFS", value: "Foldover Scratch-Guard Mittens" },
              { title: "CARE", value: "Warm Gentle Wash" }
            ],
            colors: [
              { name: "Soft Blush", hex_code: "#FADADD" },
              { name: "Ivory White", hex_code: "#FFFFF0" }
            ],
            sizes: ["0-3M", "3-6M", "6-12M"],
            images: ["/images/cat-babies-tshirt.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Nandhini K.", rating: 5, title: "Kimono design is a lifesaver", comment: "No stress of pulling clothes over baby's head. The mitten cuffs protect against scratches." }
            ]
          },
          {
            name: "HooDee Daddy Nautical Striped Sunsuit Summer Romper",
            slug: "hd-nautical-striped-sunsuit-summer-romper",
            sku: "HD-B-ROM-03",
            price: 549,
            original_price: 899,
            badge_label: "Summer Drop",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "Rompers",
            description: "Lightweight, breathable cotton seersucker striped romper designed for warm sunny afternoons and playtime.",
            specifications: [
              { title: "FABRIC", value: "100% Breathable Cotton Seersucker" },
              { title: "BUTTONS", value: "Smooth Coconut Shell Buttons" },
              { title: "LEGS", value: "Gently Gathered Elastic Leg Openings" },
              { title: "FEEL", value: "Airy & Featherlight" }
            ],
            colors: [
              { name: "Sky Blue Stripe", hex_code: "#BAE6FD" },
              { name: "Sand Stripe", hex_code: "#E7E5E4" }
            ],
            sizes: ["3-6M", "6-12M", "12-18M", "18-24M"],
            images: ["/images/cat-babies-romper.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Radha V.", rating: 5, title: "Adorable summer romper", comment: "Keeps baby cool and looks very chic in family photos." }
            ]
          }
        ]
      },
      {
        name: "Soft Ribbed Sleepsuits",
        slug: "soft-ribbed-sleepsuits",
        image: "/images/cat-babies-pyjama.jpg",
        products: [
          {
            name: "HooDee Daddy Two-Way Zipper Organic Ribbed Footie Sleepsuit",
            slug: "hd-two-way-zipper-organic-ribbed-footie-sleepsuit",
            sku: "HD-B-SLP-01",
            price: 699,
            original_price: 1199,
            badge_label: "Must Have",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Sleepsuits",
            description: "Two-way zip from bottom to top allows quick midnight diaper changes without exposing baby's chest. Protective fabric tab behind zipper.",
            specifications: [
              { title: "ZIPPER", value: "Two-Way Inverted Smooth Zip" },
              { title: "FABRIC", value: "95% Organic Cotton, 5% Stretch Rib" },
              { title: "SOLES", value: "Anti-Slip Grippy Dots on Soles (6M+)" },
              { title: "GUARD", value: "Full-Length Soft Zipper Chin Guard" }
            ],
            colors: [
              { name: "Cloud Grey", hex_code: "#E2E8F0" },
              { name: "Honey Ochre", hex_code: "#F59E0B" }
            ],
            sizes: ["0-3M", "3-6M", "6-12M", "12-18M"],
            images: ["/images/cat-babies-pyjama.jpg", "/images/banner-babies.jpg"],
            reviews: [
              { name: "Soundarya M.", rating: 5, title: "Best sleepsuit ever", comment: "The two-way zipper makes 3 AM diaper changes a breeze. Stretchy and cozy." }
            ]
          },
          {
            name: "HooDee Daddy Cozy Bear Ears Hooded Fleece Sleepsuit",
            slug: "hd-cozy-bear-ears-hooded-fleece-sleepsuit",
            sku: "HD-B-SLP-02",
            price: 899,
            original_price: 1499,
            badge_label: "Winter Warmth",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sleepsuits",
            description: "Cute bear ears on hood with warm sherpa fleece shell and pure combed cotton inner lining to prevent overheating.",
            specifications: [
              { title: "SHELL", value: "Plush Sherpa Fleece Exterior" },
              { title: "LINING", value: "100% Breathable Cotton Jersey Interior" },
              { title: "HOOD", value: "Adorable 3D Bear Ear Accents" },
              { title: "CARE", value: "Machine Wash Delicate" }
            ],
            colors: [
              { name: "Teddy Brown", hex_code: "#92400E" },
              { name: "Polar White", hex_code: "#F8FAFC" }
            ],
            sizes: ["3-6M", "6-12M", "12-18M"],
            images: ["/images/cat-babies-hoodie.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Aarthi S.", rating: 5, title: "Super warm and adorable", comment: "Baby looked like a cute teddy bear! Cotton lining on the inside keeps baby sweat-free." }
            ]
          },
          {
            name: "HooDee Daddy Pastel Neutral Everyday Sleep & Play Suit",
            slug: "hd-pastel-neutral-everyday-sleep-and-play-suit",
            sku: "HD-B-SLP-03",
            price: 629,
            original_price: 1049,
            badge_label: "Daily Cozy",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sleepsuits",
            description: "Super-soft combed cotton sleepsuit with enclosed toes and gentle stretch neckline for round-the-clock comfort.",
            specifications: [
              { title: "FABRIC", value: "100% Breathable Fine Interlock Cotton" },
              { title: "TOES", value: "Seamless Enclosed Soft Footies" },
              { title: "SNAPS", value: "Reinforced Placket Bottom Snaps" },
              { title: "WASH", value: "Pre-Shrunk Fade-Resistant" }
            ],
            colors: [
              { name: "Pistachio Green", hex_code: "#A7F3D0" },
              { name: "Lavender Fog", hex_code: "#DDD6FE" }
            ],
            sizes: ["0-3M", "3-6M", "6-12M"],
            images: ["/images/cat-babies-pyjama.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Geetha M.", rating: 5, title: "Lovely colors and fit", comment: "Very cute pastel colors. Fits comfortably over cloth diapers." }
            ]
          }
        ]
      },
      {
        name: "Baby Swaddles & Cozy Sets",
        slug: "baby-swaddles-cozy-sets",
        image: "/images/dept-babies.jpg",
        products: [
          {
            name: "HooDee Daddy 3-Piece Organic Cotton Top, Bottom & Beanie Set",
            slug: "hd-3-piece-organic-cotton-top-bottom-beanie-set",
            sku: "HD-B-SET-01",
            price: 849,
            original_price: 1399,
            badge_label: "Gift Set",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Sets",
            description: "Complete newborn hospital coming-home outfit: long-sleeve side-snap top, footed pant with gentle elastic band, and knotted beanie.",
            specifications: [
              { title: "INCLUDES", value: "Top, Footed Leggings, Knotted Cap" },
              { title: "MATERIAL", value: "100% Organic Fine Rib Cotton" },
              { title: "WAISTBAND", value: "Umbilical-Cord-Friendly Soft Band" },
              { title: "PACKAGING", value: "Eco Kraft Gift Box Included" }
            ],
            colors: [
              { name: "Cream Oatmeal", hex_code: "#E5E7EB" },
              { name: "Sage Stripe", hex_code: "#9CAF88" }
            ],
            sizes: ["0-3M", "3-6M"],
            images: ["/images/cat-babies-tshirt.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Priya Chandran", rating: 5, title: "Perfect hospital homecoming gift", comment: "The umbilical cord friendly waistband was so thoughtful. Beautiful fabric." }
            ]
          },
          {
            name: "HooDee Daddy Buttery-Soft Bamboo Cotton Swaddle Blanket Duo",
            slug: "hd-buttery-soft-bamboo-cotton-swaddle-blanket-duo",
            sku: "HD-B-SET-02",
            price: 799,
            original_price: 1299,
            badge_label: "Pack of 2",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Swaddles",
            description: "Extra large 120 x 120 cm pre-washed swaddles. Generously sized to wrap baby securely, use as a stroller shade, or nursing cover.",
            specifications: [
              { title: "SIZE", value: "120 cm x 120 cm (Extra Large)" },
              { title: "BLEND", value: "70% Bamboo Viscose, 30% Organic Cotton" },
              { title: "TOUCH", value: "Silky Breathable Open Weave" },
              { title: "CARE", value: "Machine Wash, Becomes Softer with Use" }
            ],
            colors: [
              { name: "Eucalyptus Leaves", hex_code: "#A7F3D0" },
              { name: "Dappled Fawn", hex_code: "#FED7AA" }
            ],
            sizes: ["One Size"],
            images: ["/images/cat-babies-pyjama.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Harini R.", rating: 5, title: "Silky and breathable", comment: "Large enough to swaddle easily. Wash after wash it gets even softer." }
            ]
          },
          {
            name: "HooDee Daddy Knitted Newborn Cardigan & Booties Set",
            slug: "hd-knitted-newborn-cardigan-booties-set",
            sku: "HD-B-SET-03",
            price: 999,
            original_price: 1699,
            badge_label: "Atelier Knits",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Knitwear",
            description: "Hand-finished organic cotton knit button cardigan with matching stay-on booties. Natural wooden button accents.",
            specifications: [
              { title: "MATERIAL", value: "100% Combed Non-Allergic Cotton Yarn" },
              { title: "BUTTONS", value: "Natural Polished Wood Buttons" },
              { title: "BOOTIES", value: "Gentle Ribbed Ankle Cuff Stays Put" },
              { title: "ORIGIN", value: "Handcrafted in South India" }
            ],
            colors: [
              { name: "Warm Biscuit", hex_code: "#D6D3D1" },
              { name: "Muted Olive", hex_code: "#65A30D" }
            ],
            sizes: ["0-3M", "3-6M", "6-12M"],
            images: ["/images/cat-babies-hoodie.jpg", "/images/dept-babies.jpg"],
            reviews: [
              { name: "Yamini S.", rating: 5, title: "Exquisite heirloom knit", comment: "Looks like a bespoke boutique gift. High quality finishing." }
            ]
          }
        ]
      }
    ]
  },

  // ── 4. GIRLS ──────────────────────────────────────────────────────────
  {
    categorySlug: "girls",
    categoryName: "Girls",
    subcategories: [
      {
        name: "Cute Pastel Graphic Tees",
        slug: "cute-pastel-graphic-tees",
        image: "/images/cat-girls-round-neck.jpg",
        products: [
          {
            name: "HooDee Daddy Girls' Dreamer Butterfly Pastel Graphic Tee",
            slug: "hd-girls-dreamer-butterfly-pastel-graphic-tee",
            sku: "HD-G-TEE-01",
            price: 599,
            original_price: 999,
            badge_label: "Best Seller",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "Whimsical watercolor butterfly illustration with subtle glitter highlights. 200 GSM skin-friendly bio-polished cotton.",
            specifications: [
              { title: "FABRIC", value: "200 GSM 100% Bio-Polished Cotton" },
              { title: "PRINT", value: "Skin-Safe Water-Based Inks with Sparkle" },
              { title: "NECK", value: "Soft Ribbed Crew Collar" },
              { title: "FIT", value: "Comfort Casual Fit" }
            ],
            colors: [
              { name: "Lilac Lavender", hex_code: "#DDD6FE" },
              { name: "Pastel Buttercup", hex_code: "#FEF08A" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-girls-round-neck.jpg", "/images/banner-girls.jpg"],
            reviews: [
              { name: "Revathi S.", rating: 5, title: "My daughter's favorite t-shirt", comment: "The glitter doesn't come off in wash, and the cotton is super soft. Fits true to size." },
              { name: "Anu Balaji", rating: 5, title: "Lovely pastel shades", comment: "Quality of the fabric is much better than mall brands." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Rainbow Stripe Boxy Drop-Shoulder Tee",
            slug: "hd-girls-rainbow-stripe-boxy-drop-shoulder-tee",
            sku: "HD-G-TEE-02",
            price: 629,
            original_price: 1049,
            badge_label: "Trending",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "Retro yarn-dyed horizontal pastel stripes on modern drop-shoulder boxy tee. Colors stay bright wash after wash.",
            specifications: [
              { title: "FABRIC", value: "Yarn-Dyed 100% Combed Cotton Jersey" },
              { title: "SILHOUETTE", value: "Trendy Boxy Dropped Shoulder" },
              { title: "WASH", value: "Pre-Washed Anti-Shrink" },
              { title: "CARE", value: "Machine Wash Warm" }
            ],
            colors: [
              { name: "Pastel Sorbet", hex_code: "#FBCFE8" },
              { name: "Sky Rainbow", hex_code: "#BAE6FD" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-girls-high-neck.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Shalini K.", rating: 5, title: "Vibrant and chic", comment: "Colors are cheerful and subtle. My daughter loves the relaxed fit." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Floral Botanical Minimalist Pocket Tee",
            slug: "hd-girls-floral-botanical-minimalist-pocket-tee",
            sku: "HD-G-TEE-03",
            price: 549,
            original_price: 899,
            badge_label: "Essential",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "Dainty embroidered wildflower bouquet emerging from the chest pocket. Understated classic styling for school or weekend.",
            specifications: [
              { title: "FABRIC", value: "210 GSM Combed Cotton" },
              { title: "DETAIL", value: "Embroidered Botanical Wildflower" },
              { title: "SEAMS", value: "Soft Taped Shoulder-to-Shoulder" },
              { title: "ORIGIN", value: "Crafted in Tirupur" }
            ],
            colors: [
              { name: "Marshmallow White", hex_code: "#F8FAFC" },
              { name: "Soft Sage", hex_code: "#A7F3D0" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-girls-round-neck.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Meenakshi T.", rating: 5, title: "Sweet embroidery", comment: "The little flower embroidery is delicate and well done. Good thick cotton." }
            ]
          }
        ]
      },
      {
        name: "Cozy Knit Sweaters & Cardigans",
        slug: "cozy-knit-sweaters-cardigans",
        image: "/images/cat-girls-nightwear.jpg",
        products: [
          {
            name: "HooDee Daddy Girls' Pastel Chunky Knit Button Cardigan",
            slug: "hd-girls-pastel-chunky-knit-button-cardigan",
            sku: "HD-G-SWT-01",
            price: 1199,
            original_price: 1999,
            badge_label: "Winter Pick",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Cardigans",
            description: "Plush chunky knit cardigan featuring oversized faux pearl buttons and drop shoulder sleeves. Gentle non-scratchy yarn.",
            specifications: [
              { title: "YARN", value: "Ultra-Soft Cotton-Acrylic Cloud Blend" },
              { title: "BUTTONS", value: "Lustrous Faux Pearl Buttons" },
              { title: "CUFFS", value: "Snug Ribbed Cuffs to Trap Warmth" },
              { title: "TOUCH", value: "Zero Itch Guarantee" }
            ],
            colors: [
              { name: "Rose Blush", hex_code: "#F472B6" },
              { name: "Cream Vanilla", hex_code: "#FEF9C3" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-girls-nightwear.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Sangeetha N.", rating: 5, title: "Warm without irritating skin", comment: "My daughter usually complains about sweaters itching, but she wore this all evening without fuss." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Embroidered Daisy Pullover Fleece Hoodie",
            slug: "hd-girls-embroidered-daisy-pullover-fleece-hoodie",
            sku: "HD-G-SWT-02",
            price: 1299,
            original_price: 2199,
            badge_label: "Cozy Drop",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Hoodies",
            description: "320 GSM brushed fleece with sweet daisy flower embroidery across the chest and a cozy lined hood.",
            specifications: [
              { title: "FABRIC", value: "320 GSM Cotton-Poly Brushed Fleece" },
              { title: "EMBROIDERY", value: "Satin Thread Daisy Accents" },
              { title: "POCKET", value: "Classic Kangaroo Handwarmer" },
              { title: "CARE", value: "Turn Inside Out to Wash" }
            ],
            colors: [
              { name: "Periwinkle Blue", hex_code: "#C7D2FE" },
              { name: "Warm Peach", hex_code: "#FDBA74" }
            ],
            sizes: ["6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-girls-nightwear.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Vanitha M.", rating: 5, title: "Super cute and warm", comment: "Thick fleece inside keeps warm in hill station trips. Embroidery is top notch." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Ribbed Crewneck Everyday Sweater",
            slug: "hd-girls-ribbed-crewneck-everyday-sweater",
            sku: "HD-G-SWT-03",
            price: 1099,
            original_price: 1799,
            badge_label: "Classic",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sweaters",
            description: "Lightweight, flexible ribbed knit sweater that layers comfortably under coats or school uniforms without bulk.",
            specifications: [
              { title: "YARN", value: "100% Breathable Combed Cotton" },
              { title: "STITCH", value: "Vertical Rib Stretch Construction" },
              { title: "FIT", value: "Slim Flexible Fit" },
              { title: "WASH", value: "Machine Wash Delicate" }
            ],
            colors: [
              { name: "Soft Mint", hex_code: "#A7F3D0" },
              { name: "Caramel Tan", hex_code: "#D97706" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-girls-high-neck.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Bhavani R.", rating: 5, title: "Great lightweight knit", comment: "Very stretchy and easy for my 8-year-old to put on herself." }
            ]
          }
        ]
      },
      {
        name: "Tiered Floral Summer Dresses",
        slug: "tiered-floral-summer-dresses",
        image: "/images/cat-girls-long-gown.jpg",
        products: [
          {
            name: "HooDee Daddy Girls' Garden Bloom Tiered Cotton Midi Dress",
            slug: "hd-girls-garden-bloom-tiered-cotton-midi-dress",
            sku: "HD-G-DRS-01",
            price: 1149,
            original_price: 1899,
            badge_label: "Party Pick",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Dresses",
            description: "Three gathered tiers of breezy pure cotton printed with botanical blossoms. Flutter cap sleeves and bow-tie rear ribbon.",
            specifications: [
              { title: "FABRIC", value: "100% Lightweight Cotton Cambric" },
              { title: "LINING", value: "100% Soft Cotton Voile Full Lining" },
              { title: "BACK", value: "Concealed YKK Zipper with Bow Tie" },
              { title: "TWIRL", value: "Full Flare Twirl Hem" }
            ],
            colors: [
              { name: "Garden Rose", hex_code: "#F472B6" },
              { name: "Sunlit Daisy", hex_code: "#FDE047" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-girls-long-gown.jpg", "/images/banner-girls.jpg"],
            reviews: [
              { name: "Devi Subramaniam", rating: 5, title: "Twirls beautifully!", comment: "The pure cotton lining prevents sweat, and the full flare is dream-like. My daughter didn't want to take it off." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Chambray Blue Button-Front Pinafore Dress",
            slug: "hd-girls-chambray-blue-button-front-pinafore-dress",
            sku: "HD-G-DRS-02",
            price: 1249,
            original_price: 2099,
            badge_label: "Timeless",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Dresses",
            description: "Soft washed indigo chambray pinafore dress featuring faux tortoise buttons and patch front pockets.",
            specifications: [
              { title: "FABRIC", value: "100% Washed Soft Cotton Chambray" },
              { title: "POCKETS", value: "Dual Curved Front Patch Pockets" },
              { title: "STRAPS", value: "Adjustable Button Straps" },
              { title: "STYLING", value: "Layer with tees or turtle necks" }
            ],
            colors: [
              { name: "Light Chambray Blue", hex_code: "#93C5FD" },
              { name: "Indigo Rinse", hex_code: "#1E3A8A" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-girls-long-gown.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Padma K.", rating: 5, title: "Very versatile pinafore", comment: "Can be styled for summer with a tee, or winter with a knit. Durable chambray cotton." }
            ]
          },
          {
            name: "HooDee Daddy Girls' Sunburst Yellow Smocked Bodice Frock",
            slug: "hd-girls-sunburst-yellow-smocked-bodice-frock",
            sku: "HD-G-DRS-03",
            price: 999,
            original_price: 1649,
            badge_label: "Festive Joy",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "Dresses",
            description: "Elastic smocked stretchy bodice with delicate ruffle shoulder trim. Breathable pure cotton fabric ensures all-day comfort during celebrations.",
            specifications: [
              { title: "BODICE", value: "Hand-Smocked Stretchy Fit" },
              { title: "FABRIC", value: "100% Bio-Washed Cotton Poplin" },
              { title: "HEM", value: "Scalloped Embroidered Border" },
              { title: "CARE", value: "Gentle Hand Wash or Machine Cold" }
            ],
            colors: [
              { name: "Marigold Yellow", hex_code: "#F59E0B" },
              { name: "Coral Blossom", hex_code: "#FB7185" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-girls-long-gown.jpg", "/images/dept-girls.jpg"],
            reviews: [
              { name: "Kavitha R.", rating: 5, title: "Comfortable smocked fit", comment: "Stretchy bodice means she can wear it as she grows. Beautiful cheerful color." }
            ]
          }
        ]
      }
    ]
  },

  // ── 5. BOYS ───────────────────────────────────────────────────────────
  {
    categorySlug: "boys",
    categoryName: "Boys",
    subcategories: [
      {
        name: "Active Graphic Sports Tees",
        slug: "active-graphic-sports-tees",
        image: "/images/cat-boys-round-neck.jpg",
        products: [
          {
            name: "HooDee Daddy Boys' Street Velocity Graphic Skate Tee",
            slug: "hd-boys-street-velocity-graphic-skate-tee",
            sku: "HD-B-TEE-01",
            price: 599,
            original_price: 999,
            badge_label: "Best Seller",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "Dynamic typography artwork on 210 GSM bio-polished cotton. Reinforced double-needle seams built for playground action.",
            specifications: [
              { title: "FABRIC", value: "210 GSM 100% Combed Cotton" },
              { title: "PRINT", value: "Non-Cracking Screen Print" },
              { title: "SEAMS", value: "Reinforced Shoulder & Neck Taping" },
              { title: "WASH", value: "Resistant to Fading" }
            ],
            colors: [
              { name: "Jet Black", hex_code: "#111827" },
              { name: "Cobalt Blue", hex_code: "#1D4ED8" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-boys-round-neck.jpg", "/images/banner-boys.jpg"],
            reviews: [
              { name: "Ramesh Kannan", rating: 5, title: "Durable and tough", comment: "My son plays rough in the park, and this t-shirt holds up without tearing or fading. Excellent." },
              { name: "Suresh P.", rating: 5, title: "Great fit for active boys", comment: "Breathable pure cotton, no polyester sweat smell. Very happy." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Retro Mountain Adventure Raglan Tee",
            slug: "hd-boys-retro-mountain-adventure-raglan-tee",
            sku: "HD-B-TEE-02",
            price: 629,
            original_price: 1049,
            badge_label: "New Season",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "T-Shirts",
            description: "Classic contrast 3/4 raglan sleeves and vintage outdoor mountain graphic on heather cotton jersey.",
            specifications: [
              { title: "FABRIC", value: "100% Ring-Spun Cotton Jersey" },
              { title: "SLEEVES", value: "Contrast Raglan Sleeves" },
              { title: "FIT", value: "Athletic Active Cut" },
              { title: "CARE", value: "Machine Wash Warm" }
            ],
            colors: [
              { name: "Heather / Navy", hex_code: "#334155" },
              { name: "White / Pine Green", hex_code: "#15803D" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-boys-high-neck.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Kishore N.", rating: 5, title: "Sporty and comfortable", comment: "Raglan sleeves give good arm movement. Print has retro charm." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Minimalist Urban Typography Tee",
            slug: "hd-boys-minimalist-urban-typography-tee",
            sku: "HD-B-TEE-03",
            price: 549,
            original_price: 899,
            badge_label: "Essential",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "T-Shirts",
            description: "High-density clean typography on chest. Drop shoulder modern styling in premium cotton.",
            specifications: [
              { title: "FABRIC", value: "220 GSM Bio-Washed Combed Cotton" },
              { title: "COLLAR", value: "Ribbed Lycra Collar Holds Shape" },
              { title: "FIT", value: "Relaxed Boxy Silhouette" },
              { title: "ORIGIN", value: "Crafted in Tirupur" }
            ],
            colors: [
              { name: "Olive Green", hex_code: "#4B5320" },
              { name: "Chalk White", hex_code: "#F8FAFC" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-boys-round-neck.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Ashok M.", rating: 5, title: "Simple and high quality", comment: "Thick fabric and neat typography. Looks much more expensive than ₹549." }
            ]
          }
        ]
      },
      {
        name: "Everyday Pullover Hoodies",
        slug: "everyday-pullover-hoodies",
        image: "/images/cat-boys-hoodie.jpg",
        products: [
          {
            name: "HooDee Daddy Boys' Colorblock Heavyweight Cotton Hoodie",
            slug: "hd-boys-colorblock-heavyweight-cotton-hoodie",
            sku: "HD-B-HOD-01",
            price: 1299,
            original_price: 2199,
            badge_label: "Winter Pick",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Hoodies",
            description: "350 GSM brushed cotton fleece colorblock hoodie with a kangaroo pocket and double-stitched hood.",
            specifications: [
              { title: "FABRIC", value: "350 GSM Heavy Cotton Fleece" },
              { title: "DESIGN", value: "Contemporary 3-Panel Colorblock" },
              { title: "CUFFS", value: "Snug Stretch Ribbed Cuffs" },
              { title: "HOOD", value: "Double-Layer Jersey Lined Hood" }
            ],
            colors: [
              { name: "Navy / Mustard / White", hex_code: "#1E3A8A" },
              { name: "Charcoal / Olive / Black", hex_code: "#374151" }
            ],
            sizes: ["6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-boys-hoodie.jpg", "/images/banner-boys.jpg"],
            reviews: [
              { name: "Manikandan R.", rating: 5, title: "Very warm and stylish", comment: "My 10-year-old son wears this daily. Colorblock design looks very trendy." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Camo Print Fleece Zip-Up Jacket",
            slug: "hd-boys-camo-print-fleece-zip-up-jacket",
            sku: "HD-B-HOD-02",
            price: 1399,
            original_price: 2299,
            badge_label: "Outdoor",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Hoodies",
            description: "Subtle dark tone camouflage print fleece with a chin guard zipper and handwarmer side pockets.",
            specifications: [
              { title: "FABRIC", value: "340 GSM Brushed Thermal Fleece" },
              { title: "ZIPPER", value: "Heavy-Duty YKK with Protective Chin Guard" },
              { title: "COLLAR", value: "Stand-Up Chill-Block Collar" },
              { title: "CARE", value: "Machine Wash Warm" }
            ],
            colors: [
              { name: "Urban Camo Grey", hex_code: "#475569" },
              { name: "Night Camo Green", hex_code: "#2E4F4F" }
            ],
            sizes: ["6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-boys-hoodie.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Pradeep T.", rating: 5, title: "Sturdy zipper and warm fleece", comment: "Zipper glides smoothly without catching. Great for winter mornings." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Classic Varsity Stripe Crewneck Sweatshirt",
            slug: "hd-boys-classic-varsity-stripe-crewneck-sweatshirt",
            sku: "HD-B-HOD-03",
            price: 1149,
            original_price: 1899,
            badge_label: "Varsity",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Sweatshirts",
            description: "American collegiate styling with dual-stripe ribbed collar and cuffs on soft 320 GSM cotton fleece.",
            specifications: [
              { title: "FABRIC", value: "320 GSM French Terry Fleece" },
              { title: "TRIM", value: "Two-Tone Jacquard Ribbed Trim" },
              { title: "FIT", value: "Regular Relaxed Everyday Fit" },
              { title: "ORIGIN", value: "Crafted in Atelier" }
            ],
            colors: [
              { name: "Crimson Red / White", hex_code: "#991B1B" },
              { name: "Heather Grey / Navy", hex_code: "#9CA3AF" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-boys-hoodie.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Senthil K.", rating: 5, title: "Great varsity look", comment: "Ribbed neck and sleeves look smart. Doesn't lose shape after washing." }
            ]
          }
        ]
      },
      {
        name: "Durable Cargo Joggers & Shorts",
        slug: "durable-cargo-joggers-shorts",
        image: "/images/cat-boys-shorts.jpg",
        products: [
          {
            name: "HooDee Daddy Boys' Reinforced Knee Tactical Cargo Jogger",
            slug: "hd-boys-reinforced-knee-tactical-cargo-jogger",
            sku: "HD-B-JOG-01",
            price: 1099,
            original_price: 1799,
            badge_label: "Playground Proof",
            badge_type: "hot",
            is_best_seller: true,
            is_new_arrival: false,
            product_type: "Joggers",
            description: "Heavy 280 GSM cotton twill with double-fabric knee panels to prevent wear and tear during sports and play.",
            specifications: [
              { title: "FABRIC", value: "280 GSM 100% Heavy Cotton Twill" },
              { title: "KNEES", value: "Reinforced Double-Layer Knee Patches" },
              { title: "WAIST", value: "Full Elastic Waist with Contrast Drawstring" },
              { title: "POCKETS", value: "4 Pockets Including Velcro Cargo Flaps" }
            ],
            colors: [
              { name: "Combat Khaki", hex_code: "#78716C" },
              { name: "Tactical Black", hex_code: "#18181B" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
            images: ["/images/cat-boys-shorts.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Karthikeyan B.", rating: 5, title: "Finally pants that don't tear at the knees!", comment: "The reinforced knee patches are brilliant. Sturdy cotton that lasts." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Everyday Washed Denim Straight Jogger",
            slug: "hd-boys-everyday-washed-denim-straight-jogger",
            sku: "HD-B-JOG-02",
            price: 1199,
            original_price: 1999,
            badge_label: "Stretch Denim",
            badge_type: "new",
            is_best_seller: false,
            is_new_arrival: true,
            product_type: "Joggers",
            description: "Looks like authentic vintage jeans but feels as comfortable as sweatpants with a soft stretch knit denim.",
            specifications: [
              { title: "FABRIC", value: "98% Cotton, 2% Spandex Indigo Denim" },
              { title: "WAIST", value: "Ribbed Elastic Pull-On Waistband" },
              { title: "WASH", value: "Hand-Scraped Vintage Fade" },
              { title: "ANKLES", value: "Clean Straight Cuff with Interior Stitch" }
            ],
            colors: [
              { name: "Medium Indigo Wash", hex_code: "#2563EB" },
              { name: "Dark Raw Wash", hex_code: "#1E3A8A" }
            ],
            sizes: ["6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-boys-shorts.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Anandakumar V.", rating: 5, title: "Super soft stretch denim", comment: "No stiff denim fuss. My son wears it happily without complaining." }
            ]
          },
          {
            name: "HooDee Daddy Boys' Summer Multi-Pocket Adventure Cargo Shorts",
            slug: "hd-boys-summer-multi-pocket-adventure-cargo-shorts",
            sku: "HD-B-JOG-03",
            price: 849,
            original_price: 1399,
            badge_label: "Summer Pick",
            badge_type: "sale",
            is_best_seller: false,
            is_new_arrival: false,
            product_type: "Shorts",
            description: "Ripstop cotton cargo shorts with a soft inner waistband and 5 deep utility pockets for outdoor adventures.",
            specifications: [
              { title: "FABRIC", value: "100% Breathable Ripstop Cotton" },
              { title: "POCKETS", value: "5 Secured Pockets with Bellowed Storage" },
              { title: "LENGTH", value: "Hits Just Above the Knee" },
              { title: "CARE", value: "Quick Dry Machine Wash" }
            ],
            colors: [
              { name: "Safari Beige", hex_code: "#E7E5E4" },
              { name: "Navy Blue", hex_code: "#1E293B" }
            ],
            sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
            images: ["/images/cat-boys-shorts.jpg", "/images/dept-boys.jpg"],
            reviews: [
              { name: "Saravanan T.", rating: 5, title: "Great summer shorts", comment: "Lightweight, plenty of pockets, and fast drying. Good purchase." }
            ]
          }
        ]
      }
    ]
  }
];

async function seed() {
  console.log("================================================================================");
  console.log("🌱 SEEDING COMPLETE CLEAN CATALOG FOR ZMW");
  console.log("================================================================================\n");

  const t = await sequelize.transaction();

  try {
    // 1. Delete old dependent data
    console.log("🧹 1. Cleaning old products, variants, colors, sizes, reviews, and subcategories...");
    await OrderItem.destroy({ where: {}, transaction: t });
    await Review.destroy({ where: {}, transaction: t });
    await ProductVariant.destroy({ where: {}, transaction: t });
    await ProductImage.destroy({ where: {}, transaction: t });
    await ProductColor.destroy({ where: {}, transaction: t });
    await ProductSize.destroy({ where: {}, transaction: t });
    await Product.destroy({ where: {}, transaction: t });
    await Subcategory.destroy({ where: {}, transaction: t });
    console.log("   ✅ Cleaned old catalog items successfully.");

    // 2. Ensure Core 5 Categories exist
    console.log("\n📁 2. Ensuring Core 5 Categories...");
    const categoryMap = new Map();
    const coreCats = [
      { name: "Men", slug: "mens", sort_order: 1 },
      { name: "Women", slug: "women", sort_order: 2 },
      { name: "Boys", slug: "boys", sort_order: 3 },
      { name: "Girls", slug: "girls", sort_order: 4 },
      { name: "Babies", slug: "babies", sort_order: 5 }
    ];

    for (const cat of coreCats) {
      let [record] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: {
          name: cat.name,
          slug: cat.slug,
          sort_order: cat.sort_order,
          is_active: true,
          show_on_homepage: true
        },
        transaction: t
      });
      await record.update({ name: cat.name, sort_order: cat.sort_order, is_active: true, show_on_homepage: true }, { transaction: t });
      categoryMap.set(cat.slug, record);
      console.log(`   ✓ Category: ${cat.name} (${cat.slug}) -> ID ${record.id}`);
    }

    // 3. Insert Subcategories and Products
    console.log("\n👕 3. Inserting Subcategories, Products, Variants & Reviews...");
    let totalProducts = 0;
    let totalVariants = 0;
    let totalReviews = 0;

    for (const group of CATALOG_DATA) {
      const category = categoryMap.get(group.categorySlug);
      if (!category) continue;

      console.log(`\n── [${category.name}] ──────────────────────────────────────────`);

      for (let sIdx = 0; sIdx < group.subcategories.length; sIdx++) {
        const subData = group.subcategories[sIdx];
        const subcategory = await Subcategory.create(
          {
            category_id: category.id,
            name: subData.name,
            slug: subData.slug,
            image_url: subData.image,
            sort_order: sIdx + 1,
            is_active: true,
            show_on_homepage: true
          },
          { transaction: t }
        );

        console.log(`  🗂️  Subcategory: ${subcategory.name} (ID ${subcategory.id})`);

        for (const pData of subData.products) {
          const product = await Product.create(
            {
              name: pData.name,
              slug: pData.slug,
              sku: pData.sku,
              category_id: category.id,
              subcategory_id: subcategory.id,
              product_type: pData.product_type,
              description: pData.description,
              price: pData.price,
              original_price: pData.original_price,
              in_stock: true,
              stock_count: 50,
              sales_count: Math.floor(Math.random() * 40) + 10,
              is_best_seller: pData.is_best_seller || false,
              is_new_arrival: pData.is_new_arrival || false,
              is_sale: pData.original_price > pData.price,
              badge_label: pData.badge_label || null,
              badge_type: pData.badge_type || null,
              is_active: true,
              specifications: pData.specifications
            },
            { transaction: t }
          );
          totalProducts++;

          // Images
          for (let iIdx = 0; iIdx < pData.images.length; iIdx++) {
            await ProductImage.create(
              {
                product_id: product.id,
                url: pData.images[iIdx],
                alt_text: `${product.name} View ${iIdx + 1}`,
                sort_order: iIdx,
                is_primary: iIdx === 0
              },
              { transaction: t }
            );
          }

          // Colors
          const createdColors = [];
          for (let cIdx = 0; cIdx < pData.colors.length; cIdx++) {
            const c = pData.colors[cIdx];
            const col = await ProductColor.create(
              {
                product_id: product.id,
                name: c.name,
                hex_code: c.hex_code,
                sort_order: cIdx
              },
              { transaction: t }
            );
            createdColors.push(col);
          }

          // Sizes
          const createdSizes = [];
          for (let szIdx = 0; szIdx < pData.sizes.length; szIdx++) {
            const szLabel = pData.sizes[szIdx];
            const sizeObj = await ProductSize.create(
              {
                product_id: product.id,
                label: szLabel,
                sort_order: szIdx
              },
              { transaction: t }
            );
            createdSizes.push(sizeObj);
          }

          // Variants Matrix
          let totalProductStock = 0;
          for (const col of createdColors) {
            for (const sz of createdSizes) {
              const stock = Math.floor(Math.random() * 20) + 15;
              totalProductStock += stock;
              const colorCode = col.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
              const sizeCode = sz.label.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

              await ProductVariant.create(
                {
                  product_id: product.id,
                  color_id: col.id,
                  size_id: sz.id,
                  sku_suffix: `${colorCode}-${sizeCode}`,
                  stock_count: stock,
                  sales_count: Math.floor(Math.random() * 15) + 2,
                  price_override: null,
                  original_price_override: null,
                  image_url: pData.images[0] || null
                },
                { transaction: t }
              );
              totalVariants++;
            }
          }
          await product.update({ stock_count: totalProductStock }, { transaction: t });

          // Customer Reviews
          let ratingSum = 0;
          for (const rev of pData.reviews) {
            ratingSum += Number(rev.rating);
            await Review.create(
              {
                product_id: product.id,
                order_item_id: null,
                user_id: null,
                customer_name: rev.name,
                customer_email: `${rev.name.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com`,
                rating: rev.rating,
                title: rev.title,
                comment: rev.comment,
                verified_purchase: true,
                is_approved: true
              },
              { transaction: t }
            );
            totalReviews++;
          }

          const avgRating = pData.reviews.length > 0
            ? Number((ratingSum / pData.reviews.length).toFixed(1))
            : 5.0;
          await product.update(
            {
              rating: avgRating,
              review_count: pData.reviews.length
            },
            { transaction: t }
          );

          console.log(`    👕 ${product.name} (SKU: ${product.sku}, Stock: ${totalProductStock}, Rating: ${avgRating}★ (${pData.reviews.length} reviews))`);
        }
      }
    }

    await t.commit();

    console.log("\n================================================================================");
    console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log(`   📁 Core Categories: 5 (Men, Women, Boys, Girls, Babies)`);
    console.log(`   🗂️  Subcategories: 15 (3 per category)`);
    console.log(`   👕 Products: ${totalProducts} (exactly 3 per subcategory)`);
    console.log(`   🎨 Product Variants: ${totalVariants}`);
    console.log(`   ⭐ Customer Reviews: ${totalReviews}`);
    console.log("================================================================================");
  } catch (err) {
    await t.rollback();
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
