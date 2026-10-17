require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { sequelize, Offer, Banner } = require("../src/models");

async function seedOffersAndBanners() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL successfully.");

    const now = new Date();
    const startsAt = new Date(now.getTime() - 2 * 86400000); // 2 days ago
    const endsAt = new Date(now.getTime() + 30 * 86400000); // 30 days from now

    // 1. Seed Active Offers
    console.log("Seeding active offers...");
    // Clear old test offers if any to prevent conflicts
    await Offer.destroy({ where: {} });

    const createdOffers = await Offer.bulkCreate([
      {
        name: "FESTIVE DROP · FLAT 20% OFF STOREWIDE",
        target_type: "all",
        target_ids: [],
        discount_type: "percentage",
        discount_value: 20.00,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true
      },
      {
        name: "MEN'S STREETWEAR DROP · FLAT 25% OFF",
        target_type: "category",
        target_ids: [1], // Mens category ID
        discount_type: "percentage",
        discount_value: 25.00,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true
      },
      {
        name: "OVERSIZED TEES FLASH SALE · FLAT 30% OFF",
        target_type: "subcategory",
        target_ids: [2], // Oversized Streetwear Tees ID
        discount_type: "percentage",
        discount_value: 30.00,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true
      }
    ]);
    console.log(`Successfully seeded ${createdOffers.length} active offers.`);

    // 2. Seed Active Offer Banners (placement: 'offers')
    console.log("Seeding active offer banners...");
    await Banner.destroy({ where: { placement: "offers" } });

    const createdOfferBanners = await Banner.bulkCreate([
      {
        placement: "offers",
        title: "LIMITED STREETWEAR DROP",
        tag: "EXCLUSIVE OFFER · SEASON 2026",
        badge_promo: "FLAT 20% OFF · STOREWIDE",
        subtitle: "Enjoy flat 20% off pure heavyweight combed cotton tees, hoodies, and cargo pants. Savings auto-applied at checkout.",
        image_url: "/images/banner-streetwear-tee.jpg",
        image_position: "center center",
        primary_cta_text: "Claim Offer & Shop",
        primary_cta_link: "/collection",
        secondary_cta_text: "Explore Men's",
        secondary_cta_link: "/collection?category=mens",
        sort_order: 1,
        is_active: true
      },
      {
        placement: "offers",
        title: "HEAVYWEIGHT WINTER HOODIES",
        tag: "DROP OF THE MONTH",
        badge_promo: "FLAT 25% OFF · MEN'S WEAR",
        subtitle: "Premium 420 GSM fleece-lined oversized hoodies tailored for supreme comfort, durability, and modern cuts.",
        image_url: "/images/banner-streetwear-hoodie.jpg",
        image_position: "center center",
        primary_cta_text: "Shop Men's Drop",
        primary_cta_link: "/collection?category=mens",
        secondary_cta_text: "View All",
        secondary_cta_link: "/collection",
        sort_order: 2,
        is_active: true
      }
    ]);
    console.log(`Successfully seeded ${createdOfferBanners.length} active offer banners.`);

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedOffersAndBanners();
