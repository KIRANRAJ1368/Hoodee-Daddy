import React, { useState, useMemo } from "react";
import SeoHead from "../components/Seo/SeoHead";
import { buildFaqSchema, buildBreadcrumbSchema } from "../utils/seoSchemas";
import { useShop } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { SHIPPING_FEE } from "../utils/shopConfig";
import { formatPrice } from "../utils/formatPrice";
import "./FAQ.css";

const SHIPPING_FEE_AMOUNT = formatPrice(SHIPPING_FEE);

const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "orders", label: "Orders & Tracking" },
  { id: "shipping", label: "Shipping & Delivery" },
  { id: "sizing", label: "Size & Fit" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "payments", label: "Payments" },
  { id: "general", label: "General" }
];

const FAQ_DATA = [
  // Orders & Tracking
  {
    id: "ord-1",
    category: "orders",
    categoryLabel: "Orders & Tracking",
    question: "How do I track my placed order?",
    answer:
      "Once your package is dispatched from our Coimbatore facility, you will receive an automated SMS and email notification with your direct AWB tracking link. You can also click 'Track My Order' in our website footer anytime and enter your Order ID or tracking number for real-time status updates."
  },
  {
    id: "ord-2",
    category: "orders",
    categoryLabel: "Orders & Tracking",
    question: "Can I modify or cancel my order after placing it?",
    answer:
      "Orders are processed quickly within 24 to 48 hours. If you need to change your delivery address or cancel an item, please contact our support team immediately at +91 9876543210 or email zmw@gmail.com before dispatch. Once an order is handed to our courier partner, it cannot be modified in transit."
  },
  {
    id: "ord-3",
    category: "orders",
    categoryLabel: "Orders & Tracking",
    question: "Will I receive an order confirmation upon checkout?",
    answer:
      "Yes, an immediate confirmation notification with your complete order breakdown and unique Order ID will be sent to the email and mobile number provided during checkout."
  },

  // Shipping & Delivery
  {
    id: "shp-1",
    category: "shipping",
    categoryLabel: "Shipping & Delivery",
    question: "What are the delivery timelines across India?",
    answer:
      "All orders are dispatched within 24 to 48 business hours. Deliveries to Tier-1 metro cities (Mumbai, Bengaluru, Delhi NCR, Chennai, Hyderabad, Kolkata) take 3 to 5 business days. Non-metro cities and regional pin codes typically take 4 to 6 business days."
  },
  {
    id: "shp-2",
    category: "shipping",
    categoryLabel: "Shipping & Delivery",
    question: "How are shipping charges calculated?",
    answer:
      "Shipping charges are dynamically calculated based on your delivery PIN code using our integrated Shiprocket courier network. Simply enter your 6-digit PIN code on any product page, in your cart, or at checkout to see the exact rate for your destination."
  },
  {
    id: "shp-3",
    category: "shipping",
    categoryLabel: "Shipping & Delivery",
    question: "Which courier partners handle deliveries?",
    answer:
      "We partner with reputable pan-India logistics providers including Blue Dart, Delhivery, DTDC, and Xpressbees to ensure safe, temperature-controlled, and tamper-evident delivery."
  },

  // Size & Fit
  {
    id: "siz-1",
    category: "sizing",
    categoryLabel: "Size & Fit",
    question: "How do ZWMStore oversized t-shirts fit?",
    answer:
      "Our oversized t-shirts feature drop shoulders, an expanded chest drape, and a modern boxy silhouette. If you prefer the intentional streetwear relaxed drape, choose your true standard size. If you prefer a standard tailored fit, order one size down."
  },
  {
    id: "siz-2",
    category: "sizing",
    categoryLabel: "Size & Fit",
    question: "Where can I view exact garment dimensions?",
    answer:
      "You can access our interactive Size Guide anytime on any product page or via the Size Guide link in the footer. We provide exact chest, body length, shoulder width, and sleeve measurements in both inches and centimeters."
  },
  {
    id: "siz-3",
    category: "sizing",
    categoryLabel: "Size & Fit",
    question: "What fabric weight and GSM do you use?",
    answer:
      "Our everyday t-shirts use heavyweight 220 to 280 GSM super-combed cotton for structured drape and durability. Our fleece hoodies and sweatshirts feature substantial 380+ GSM combed fleece."
  },

  // Returns & Refunds
  {
    id: "ret-1",
    category: "returns",
    categoryLabel: "Returns & Refunds",
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 7-day return and exchange window from the date of delivery. Garments must be unworn, unwashed, and returned in their original packaging with brand tags intact. Items marked as final sale are non-returnable."
  },
  {
    id: "ret-2",
    category: "returns",
    categoryLabel: "Returns & Refunds",
    question: "How do I exchange an item for a different size?",
    answer:
      "To request a size replacement, contact our customer care team with your Order ID via email at zmw@gmail.com or WhatsApp +91 9876543210. Once verified, we schedule a convenient reverse courier pickup."
  },
  {
    id: "ret-3",
    category: "returns",
    categoryLabel: "Returns & Refunds",
    question: "How are refunds settled for prepaid and COD orders?",
    answer:
      "Prepaid refunds are credited back to your original payment source (UPI / Card / Net Banking) upon quality verification. For COD orders, refunds are transferred directly to your bank account via NEFT/IMPS or provided as a store voucher code."
  },

  // Payments
  {
    id: "pay-1",
    category: "payments",
    categoryLabel: "Payments",
    question: "Is Cash on Delivery (COD) available?",
    answer:
      "Yes! Cash on Delivery (COD) is supported for over 19,000+ serviceable pin codes across India. You can select COD at the payment step of checkout."
  },
  {
    id: "pay-2",
    category: "payments",
    categoryLabel: "Payments",
    question: "Which online payment methods do you accept?",
    answer:
      "We accept all major payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, MasterCard, RuPay), and Net Banking across all Indian banks."
  },
  {
    id: "pay-3",
    category: "payments",
    categoryLabel: "Payments",
    question: "Are payment transactions secure?",
    answer:
      "Yes, absolutely. All payments are processed through RBI-authorized payment gateways featuring bank-grade. ZWMStore never stores sensitive credit/debit card numbers or passwords."
  },

  // General
  {
    id: "gen-1",
    category: "general",
    categoryLabel: "General",
    question: "How should I wash and care for my ZWMStore clothing?",
    answer:
      "Machine wash inside-out in cold water with similar colors. Do not bleach or dry clean. Hang dry in shade or tumble dry on low. Iron inside-out on medium heat without touching screen prints."
  },
  {
    id: "gen-2",
    category: "general",
    categoryLabel: "General",
    question: "Where are ZWMStore products made?",
    answer:
      "All our apparel is proudly designed, knitted, dyed, and manufactured in India's renowned textile corridor — Coimbatore & Tiruppur, Tamil Nadu."
  },
  {
    id: "gen-3",
    category: "general",
    categoryLabel: "General",
    question: "How can I contact the customer support team?",
    answer:
      "Our support desk is active Monday through Saturday from 10:00 AM to 5:00 PM IST. You can reach us via email at zmw@gmail.com, phone at +91 9876543210, or directly through our website WhatsApp chat."
  }
];

export default function FAQ() {
  const { seoSettings } = useShop();
  const baseUrl = (seoSettings?.canonical_base_url || "https://zmwclothing.com").replace(/\/+$/, "");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIds, setOpenIds] = useState(["ord-1"]);

  const schemas = useMemo(() => {
    return [
      buildFaqSchema(FAQ_DATA),
      buildBreadcrumbSchema(
        [
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" }
        ],
        baseUrl
      )
    ].filter(Boolean);
  }, [baseUrl]);

  const toggleItem = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredItems =
    activeCategory === "all"
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === activeCategory);

  return (
    <div className="faq-page">
      <SeoHead
        title="Frequently Asked Questions (FAQ) — Orders, Shipping & Returns | ZMW Clothing"
        description="Find prompt answers regarding our premium streetwear fits, nationwide Indian logistics, easy returns, and payment options at ZMW Clothing."
        canonicalPath="/faq"
        schemas={schemas}
      />
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="faq-hero" aria-label="Frequently Asked Questions">
        <div className="container">
          <span className="faq-eyebrow">HELP & KNOWLEDGE BASE</span>
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Find prompt answers regarding our streetwear fits, orders, Indian logistics, returns, and payment options.
          </p>
        </div>
      </section>

      {/* ── Accordion Section ────────────────────────────────────── */}
      <section className="faq-section">
        <div className="container">
          {/* Category Tabs Bar */}
          <div className="faq-categories-nav">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`faq-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          <div className="faq-accordion-list">
            {filteredItems.map((item) => {
              const isOpen = openIds.includes(item.id);
              return (
                <div key={item.id} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-question-wrap">
                      <span className="faq-category-tag">{item.categoryLabel}</span>
                      <span className="faq-question">{item.question}</span>
                    </div>
                    <span className="faq-icon-wrap" aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Help & WhatsApp Support Box ──────────────────────── */}
          <div className="faq-footer-card">
            <div className="faq-footer-content">
              <h3>Didn't find what you're looking for?</h3>
              <p>
                Our customer assistance team is here Monday – Saturday (10:00 AM – 5:00 PM IST) to help you with personal fit recommendations, order status, or exchanges.
              </p>
            </div>
            <div className="faq-footer-actions">
              <a
                href={`https://api.whatsapp.com/send?phone=919876543210&text=${encodeURIComponent("Hi! I have a question regarding ZWMStore.")}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                WhatsApp Support (+91 9876543210)
              </a>
              <Link to="/contact" className="btn btn-outline btn-sm">
                Contact Page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

