import { useEffect } from "react";
import { useShop } from "../../context/ShopContext";

/**
 * Ensures a URL is absolute with the canonical base domain.
 */
export function toAbsoluteUrl(url, baseUrl = "https://zmwclothing.com") {
  if (!url) return baseUrl;
  if (/^https?:\/\//i.test(url)) return url;
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Helper to update or create an HTML meta tag.
 */
function setMetaTag(selector, attribute, attributeValue, content) {
  if (!document || !document.head) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content || "");
}

/**
 * Helper to update or create an HTML link tag (e.g. canonical).
 */
function setLinkTag(rel, href) {
  if (!document || !document.head) return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href || "");
}

/**
 * Helper to update or inject JSON-LD structured data script.
 */
function setJsonLd(schemaId, schemaData) {
  if (!document || !document.head) return;
  let script = document.getElementById(schemaId);
  if (!schemaData) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * SeoHead: Dynamic React SEO management component.
 * Updates document.title, meta tags, canonical link, Open Graph, Twitter cards,
 * and JSON-LD structured data reactive to route changes.
 */
export default function SeoHead({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage,
  ogType = "website",
  noindex = false,
  schema = null
}) {
  const { seoSettings } = useShop();

  const baseUrl = (seoSettings?.canonical_base_url || "https://zmwclothing.com").replace(/\/+$/, "");

  // Fallbacks from Admin database settings
  const finalTitle =
    title ||
    seoSettings?.default_meta_title ||
    "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture";

  const finalDescription =
    description ||
    seoSettings?.default_meta_description ||
    "Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design. Nationwide insured dispatch.";

  const finalKeywords =
    keywords ||
    seoSettings?.default_meta_keywords ||
    "ZMW clothing, luxury fashion, couture, menswear, womenswear, premium apparel, oversized t-shirts, hoodies, streetwear, Coimbatore";

  const canonicalUrl = toAbsoluteUrl(canonicalPath || window?.location?.pathname || "/", baseUrl);

  const finalOgImage = toAbsoluteUrl(
    ogImage || seoSettings?.og_image_url || "/images/zmw-logo.png",
    baseUrl
  );

  const isBlocked = noindex || seoSettings?.robots_index === false;
  const robotsDirective = isBlocked ? "noindex, nofollow" : "index, follow";

  useEffect(() => {
    // 1. Page Title
    document.title = finalTitle;

    // 2. Standard Search Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", finalDescription);
    setMetaTag('meta[name="keywords"]', "name", "keywords", finalKeywords);
    setMetaTag('meta[name="robots"]', "name", "robots", robotsDirective);

    // 3. Canonical Link
    setLinkTag("canonical", canonicalUrl);

    // 4. Open Graph Meta Tags (Social Media Sharing)
    setMetaTag('meta[property="og:title"]', "property", "og:title", finalTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", finalDescription);
    setMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMetaTag('meta[property="og:type"]', "property", "og:type", ogType);
    setMetaTag('meta[property="og:image"]', "property", "og:image", finalOgImage);
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", "ZMW Clothing");

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", finalTitle);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", finalDescription);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", finalOgImage);

    // 6. JSON-LD Structured Data
    if (schema) {
      setJsonLd("zmw-page-schema-jsonld", schema);
    } else {
      setJsonLd("zmw-page-schema-jsonld", null);
    }

    return () => {
      // Optional cleanup on unmount
    };
  }, [finalTitle, finalDescription, finalKeywords, canonicalUrl, finalOgImage, ogType, robotsDirective, schema]);

  return null;
}
