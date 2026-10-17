require('dotenv').config();
const {
  sequelize,
  Category,
  Subcategory,
  Product,
  ProductVariant,
  ProductImage,
  ProductColor,
  ProductSize,
  Review,
  Order,
  OrderItem,
  OrderStatusHistory,
  Coupon,
  ContactSubmission,
  Banner,
  HomepageSection
} = require('../src/models');

async function cleanup() {
  console.log('--- STARTING DATABASE CLEANUP & BANNER SETUP ---');

  // Disable foreign keys temporarily for clean deletion
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    console.log('1. Removing reviews...');
    await Review.destroy({ where: {}, truncate: true });

    console.log('2. Removing product variants, images, colors, sizes...');
    await ProductVariant.destroy({ where: {}, truncate: true });
    await ProductImage.destroy({ where: {}, truncate: true });
    await ProductColor.destroy({ where: {}, truncate: true });
    await ProductSize.destroy({ where: {}, truncate: true });

    console.log('3. Removing all products...');
    await Product.destroy({ where: {}, truncate: true });

    console.log('4. Removing all subcategories...');
    await Subcategory.destroy({ where: {}, truncate: true });

    console.log('5. Removing all orders, items, order status history...');
    await OrderItem.destroy({ where: {}, truncate: true });
    await OrderStatusHistory.destroy({ where: {}, truncate: true });
    await Order.destroy({ where: {}, truncate: true });

    console.log('6. Removing all coupons...');
    await Coupon.destroy({ where: {}, truncate: true });

    console.log('7. Removing all customer inquiries (contact submissions)...');
    await ContactSubmission.destroy({ where: {}, truncate: true });

    console.log('8. Cleaning categories: removing babiessss and ensuring Men, Women, Boys, Girls, Babies...');
    await Category.destroy({ where: { slug: 'babiessss' } });

    // Ensure 5 core categories with strict sequence 0, 1, 2, 3, 4
    const coreCategories = [
      { id: 1, name: 'Men', slug: 'mens', sort_order: 0, is_active: true, show_on_homepage: true },
      { id: 2, name: 'Women', slug: 'women', sort_order: 1, is_active: true, show_on_homepage: true },
      { id: 3, name: 'Boys', slug: 'boys', sort_order: 2, is_active: true, show_on_homepage: true },
      { id: 4, name: 'Girls', slug: 'girls', sort_order: 3, is_active: true, show_on_homepage: true },
      { id: 5, name: 'Babies', slug: 'babies', sort_order: 4, is_active: true, show_on_homepage: true }
    ];

    for (const cat of coreCategories) {
      const existing = await Category.findByPk(cat.id);
      if (existing) {
        await existing.update(cat);
      } else {
        await Category.create(cat);
      }
    }

    console.log('9. Updating banners: removing babiessss banner and ensuring category name banners...');
    await Banner.destroy({ where: { placement: 'babiessss' } });

    const categoryBanners = [
      {
        placement: 'mens',
        title: "MEN'S COLLECTION",
        tag: "★ PREMIUM MEN'S APPAREL · SEASON 2026",
        subtitle: 'Heavyweight pure combed cotton essentials, oversized streetwear drops, and modern cuts.',
        badge_promo: 'FLAT 25% OFF · AUTO-APPLIED',
        image_url: '/images/banner-mens.jpg',
        image_position: '85% top',
        primary_cta_text: "Shop Men's",
        primary_cta_link: '/collection?category=mens',
        secondary_cta_text: 'Pure Combed Cotton',
        secondary_cta_link: '',
        sort_order: 0,
        is_active: true
      },
      {
        placement: 'women',
        title: "WOMEN'S COLLECTION",
        tag: "★ CONTEMPORARY WOMEN'S WEAR · SEASON 2026",
        subtitle: 'Chic relaxed silhouettes, ultra-breathable pure cotton essentials, and modern minimalist artwork.',
        badge_promo: 'FLAT 25% OFF · AUTO-APPLIED',
        image_url: '/images/banner-womens.jpg',
        image_position: '85% top',
        primary_cta_text: "Shop Women's",
        primary_cta_link: '/collection?category=women',
        secondary_cta_text: 'Trending Now',
        secondary_cta_link: '',
        sort_order: 1,
        is_active: true
      },
      {
        placement: 'boys',
        title: "BOYS' COLLECTION",
        tag: "⚡ PLAYFUL DROPS · SEASON 2026",
        subtitle: 'High-energy graphic streetwear tees, durable reinforced seams, and super-soft bio-washed cotton.',
        badge_promo: 'STARTING AT ₹599 · FREE SHIPPING',
        image_url: '/images/banner-boys.jpg',
        image_position: '85% top',
        primary_cta_text: "Shop Boys'",
        primary_cta_link: '/collection?category=boys',
        secondary_cta_text: 'Durable & Breathable',
        secondary_cta_link: '',
        sort_order: 2,
        is_active: true
      },
      {
        placement: 'girls',
        title: "GIRLS' COLLECTION",
        tag: "★ SWEET & TRENDY · SEASON 2026",
        subtitle: 'Cheerful graphic prints, soft pastel tones, trendy matching sets, and gentle skin-friendly organic cotton.',
        badge_promo: 'FLAT 20% OFF · AUTO-APPLIED',
        image_url: '/images/banner-girls.jpg',
        image_position: '85% top',
        primary_cta_text: "Shop Girls'",
        primary_cta_link: '/collection?category=girls',
        secondary_cta_text: 'Hypoallergenic Comfort',
        secondary_cta_link: '',
        sort_order: 3,
        is_active: true
      },
      {
        placement: 'babies',
        title: "BABIES' COLLECTION",
        tag: "♥ TINY & SOFT · 100% BABY-SAFE",
        subtitle: 'Cozy ribbed rompers, buttery-soft essentials, and gentle organic cotton crafted for tender skin.',
        badge_promo: 'STARTING AT ₹449 · HYPOALLERGENIC',
        image_url: '/images/banner-babies.jpg',
        image_position: '85% top',
        primary_cta_text: "Shop Babies'",
        primary_cta_link: '/collection?category=babies',
        secondary_cta_text: '100% Baby-Safe',
        secondary_cta_link: '',
        sort_order: 4,
        is_active: true
      }
    ];

    for (const b of categoryBanners) {
      const existing = await Banner.findOne({ where: { placement: b.placement } });
      if (existing) {
        await existing.update(b);
      } else {
        await Banner.create(b);
      }
    }

    console.log('10. Updating homepage sections: deactivating empty product carousels (new_arrivals, best_sellers)...');
    await HomepageSection.update({ is_active: false }, { where: { section_key: 'new_arrivals' } });
    await HomepageSection.update({ is_active: false }, { where: { section_key: 'best_sellers' } });
    await HomepageSection.update({ is_active: false }, { where: { section_key: 'category_visuals' } });
    await HomepageSection.update({ is_active: false }, { where: { section_key: 'instagram_showcase' } });

    await HomepageSection.update({ is_active: true }, { where: { section_key: 'hero' } });
    await HomepageSection.update({ is_active: true }, { where: { section_key: 'mens_categories' } });
    await HomepageSection.update({ is_active: true }, { where: { section_key: 'womens_categories' } });
    await HomepageSection.update({ is_active: true }, { where: { section_key: 'boys_categories' } });
    await HomepageSection.update({ is_active: true }, { where: { section_key: 'girls_categories' } });
    await HomepageSection.update({ is_active: true }, { where: { section_key: 'babies_categories' } });

    console.log('--- DATABASE CLEANUP COMPLETED SUCCESSFULLY ---');
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cleanup error:', err);
    process.exit(1);
  });
