/**
 * SEO Schema.org JSON-LD structured data generators.
 * Validated against Google Rich Results specification for:
 * - Organization / ClothingStore
 * - WebSite
 * - Product (with Price, Currency, Availability, Brand, AggregateRating)
 * - BreadcrumbList
 * - CollectionPage / ItemList
 * - FAQPage
 */

export function buildOrganizationSchema(baseUrlOrSettings = "https://hoodeedaddy.com", settings = {}) {
  let cleanBase = "https://hoodeedaddy.com";
  let effectiveSettings = settings;
  if (typeof baseUrlOrSettings === "object" && baseUrlOrSettings !== null) {
    effectiveSettings = baseUrlOrSettings;
    cleanBase = (effectiveSettings.canonical_base_url || "https://hoodeedaddy.com").replace(/\/+$/, "");
  } else if (typeof baseUrlOrSettings === "string") {
    cleanBase = baseUrlOrSettings.replace(/\/+$/, "");
  }
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${cleanBase}/#organization`,
    name: settings.organization_name || "HooDee Daddy",
    url: cleanBase,
    logo: `${cleanBase}/images/hoodee-daddy-logo.svg`,
    image: `${cleanBase}/images/dept-family-banner.jpg`,
    description: "Luxury fashion atelier offering handcrafted menswear, womenswear, and bespoke streetwear pieces.",
    telephone: settings.organization_telephone || "+919876543210",
    email: settings.organization_email || "support@hoodeedaddy.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123, Avinashi Road, Peelamedu",
      addressLocality: "Coimbatore",
      addressRegion: "Tamil Nadu",
      postalCode: "641004",
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "11.0168",
      longitude: "76.9558"
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:30",
        closes: "20:30"
      }
    ],
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking"
  };
}

export function buildWebSiteSchema(baseUrl = "https://hoodeedaddy.com") {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${cleanBase}/#website`,
    url: cleanBase,
    name: "HooDee Daddy",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cleanBase}/collection?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildProductSchema(product, baseUrl = "https://hoodeedaddy.com", activePrice = null) {
  if (!product) return null;
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const productUrl = `${cleanBase}/products/${product.slug || product.id}`;
  const price = Number.isFinite(Number(activePrice))
    ? Number(activePrice)
    : Number.isFinite(Number(product.price))
    ? Number(product.price)
    : 999;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (typeof img === "string" ? (img.startsWith("http") ? img : `${cleanBase}${img}`) : img.url))
    : [`${cleanBase}/images/hoodee-daddy-logo.svg`];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}/#product`,
    name: product.name,
    image: images,
    description: product.description || `${product.name} crafted by HooDee Daddy.`,
    sku: product.sku || `HD-${product.id}`,
    category: product.category || "Apparel",
    brand: {
      "@type": "Brand",
      name: "HooDee Daddy"
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: price.toFixed(2),
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inStock && Number(product.stockCount ?? 1) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "HooDee Daddy"
      }
    }
  };

  if (product.reviewCount && Number(product.reviewCount) > 0 && Number(product.rating || 0) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating).toFixed(1),
      reviewCount: Number(product.reviewCount),
      bestRating: "5",
      worstRating: "1"
    };
  }

  return schema;
}

export function buildBreadcrumbSchema(items = [], baseUrl = "https://hoodeedaddy.com") {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path ? (item.path.startsWith("http") ? item.path : `${cleanBase}${item.path.startsWith("/") ? "" : "/"}${item.path}`) : cleanBase
    }))
  };
}

export function buildCategorySchema(categoryName, categorySlug, products = [], baseUrl = "https://hoodeedaddy.com") {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const categoryUrl = `${cleanBase}/categories/${categorySlug}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoryUrl}/#collection`,
    url: categoryUrl,
    name: `${categoryName} Collection — HooDee Daddy`,
    description: `Explore our premium ${categoryName.toLowerCase()} essentials crafted for everyday comfort and modern style.`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products || []).slice(0, 30).map((prod, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${cleanBase}/products/${prod.slug || prod.id}`,
        name: prod.name
      }))
    }
  };
}

export function buildFaqSchema(faqs = []) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q || faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a || faq.answer
      }
    }))
  };
}
