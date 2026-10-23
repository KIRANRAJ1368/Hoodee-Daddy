const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const imgDir = path.join(__dirname, "../../Frontend/public/images");

/**
 * Creates 4K CrazyMonk-style graphic streetwear banners
 */
async function generateBanners() {
  console.log("🎨 Starting 4K CrazyMonk Graphic Banner Generation via Sharp...");

  // ─────────────────────────────────────────────────────────────
  // 1. Hero Banner 3: Graphic Streetwear Drops (2400 x 1050)
  // ─────────────────────────────────────────────────────────────
  try {
    const baseImg3 = path.join(imgDir, "hero-mens-tshirt-banner-3.jpg");
    const outImg3 = path.join(imgDir, "crazymonk-hero-graphic-tees.jpg");

    const svgOverlay3 = `
    <svg width="2400" height="1050" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Dark gradient scrim from left to right -->
        <linearGradient id="scrim3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0a0f1d" stop-opacity="0.88"/>
          <stop offset="42%" stop-color="#0a0f1d" stop-opacity="0.65"/>
          <stop offset="70%" stop-color="#0a0f1d" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#0a0f1d" stop-opacity="0.0"/>
        </linearGradient>

        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff3366"/>
          <stop offset="100%" stop-color="#ff0033"/>
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#faa703"/>
          <stop offset="100%" stop-color="#ffd000"/>
        </linearGradient>
      </defs>

      <!-- Scrim background overlay -->
      <rect width="2400" height="1050" fill="url(#scrim3)"/>

      <!-- Top Badge / Header Tag -->
      <g transform="translate(140, 150)">
        <rect x="0" y="0" width="410" height="52" rx="26" fill="rgba(255, 51, 102, 0.15)" stroke="#ff3366" stroke-width="2"/>
        <circle cx="28" cy="26" r="8" fill="#ff3366"/>
        <text x="50" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="3">
          🔥 CRAZYMONK SPECIAL DROP
        </text>
      </g>

      <!-- Main Headline - Bold Streetwear Distressed Typography -->
      <g transform="translate(140, 310)">
        <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="120" font-weight="900" fill="#ffffff" letter-spacing="3">
          OVERSIZED
        </text>
        <text x="0" y="115" font-family="'Impact', 'Arial Black', sans-serif" font-size="120" font-weight="900" fill="#faa703" letter-spacing="3">
          GRAPHIC TEES
        </text>
      </g>

      <!-- Subtitle -->
      <g transform="translate(140, 520)">
        <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="34" font-weight="600" fill="#cbd5e1" letter-spacing="1">
          240+ GSM HEAVYWEIGHT BIO-WASH COTTON · DROP SHOULDER FIT
        </text>
      </g>

      <!-- Big Side Offer Stamp Callout (CrazyMonk Signature 'BUY 2 GET 1' style) -->
      <g transform="translate(140, 600)">
        <!-- Highlight Box -->
        <rect x="0" y="0" width="580" height="120" rx="18" fill="url(#accentGrad)" filter="drop-shadow(0 15px 30px rgba(255,0,51,0.4))"/>
        <text x="35" y="52" font-family="'Impact', Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="3">
          BUY 2 GET 1 FREE
        </text>
        <text x="35" y="95" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="800" fill="#fffdf0" letter-spacing="2">
          LIMITED RUN DROPS · AUTO-APPLIED AT CHECKOUT
        </text>
      </g>

      <!-- Feature Pill Tags -->
      <g transform="translate(140, 780)">
        <rect x="0" y="0" width="220" height="46" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        <text x="25" y="30" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff">
          ⚡ 100% PURE COTTON
        </text>

        <rect x="240" y="0" width="230" height="46" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        <text x="265" y="30" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff">
          ⭐ 4.9★ RATED DROPS
        </text>

        <rect x="490" y="0" width="230" height="46" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        <text x="515" y="30" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff">
          📦 FREE SHIPPING > ₹499
        </text>
      </g>
    </svg>
    `;

    await sharp(baseImg3)
      .resize(2400, 1050, { fit: "cover", position: "right" })
      .composite([{ input: Buffer.from(svgOverlay3), top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toFile(outImg3);

    console.log("✅ Hero Banner 3 created:", outImg3);
  } catch (err) {
    console.error("❌ Failed to create Hero Banner 3:", err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Women's Category Banner: Streetwear & Hoodies (2400 x 1050)
  // ─────────────────────────────────────────────────────────────
  try {
    const baseImgW = path.join(imgDir, "cat-banner-womens.jpg");
    const outImgW = path.join(imgDir, "crazymonk-cat-womens.jpg");

    const svgOverlayW = `
    <svg width="2400" height="1050" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrimW" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0c0a1a" stop-opacity="0.88"/>
          <stop offset="42%" stop-color="#0c0a1a" stop-opacity="0.62"/>
          <stop offset="68%" stop-color="#0c0a1a" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#0c0a1a" stop-opacity="0.0"/>
        </linearGradient>

        <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#be185d"/>
        </linearGradient>
      </defs>

      <rect width="2400" height="1050" fill="url(#scrimW)"/>

      <!-- Header Pill -->
      <g transform="translate(140, 150)">
        <rect x="0" y="0" width="390" height="52" rx="26" fill="rgba(236, 72, 153, 0.16)" stroke="#ec4899" stroke-width="2"/>
        <circle cx="28" cy="26" r="8" fill="#ec4899"/>
        <text x="50" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="3">
          ★ WOMEN'S STREETWEAR 2026
        </text>
      </g>

      <!-- Title -->
      <g transform="translate(140, 310)">
        <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="115" font-weight="900" fill="#ffffff" letter-spacing="3">
          OVERSIZED TEES
        </text>
        <text x="0" y="115" font-family="'Impact', 'Arial Black', sans-serif" font-size="115" font-weight="900" fill="#f472b6" letter-spacing="3">
          &amp; COZY HOODIES
        </text>
      </g>

      <!-- Subtitle -->
      <g transform="translate(140, 520)">
        <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="34" font-weight="600" fill="#e2e8f0" letter-spacing="1">
          CHIC RELAXED STREET FITS · 100% PURE COMBED COTTON · DROP SHOULDER
        </text>
      </g>

      <!-- Offer Stamp Box -->
      <g transform="translate(140, 600)">
        <rect x="0" y="0" width="560" height="120" rx="18" fill="url(#pinkGrad)" filter="drop-shadow(0 15px 30px rgba(236,72,153,0.35))"/>
        <text x="35" y="52" font-family="'Impact', Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="3">
          BUY 2 DROPS @ ₹999
        </text>
        <text x="35" y="95" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="800" fill="#fffdf0" letter-spacing="2">
          NEW SEASON CHIC STREETWEAR · FREE SHIPPING
        </text>
      </g>
    </svg>
    `;

    await sharp(baseImgW)
      .resize(2400, 1050, { fit: "cover", position: "right" })
      .composite([{ input: Buffer.from(svgOverlayW), top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toFile(outImgW);

    console.log("✅ Women's Category Banner created:", outImgW);
  } catch (err) {
    console.error("❌ Failed to create Women's Category Banner:", err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Offers Banner 1: Oversized T-Shirts (1200 x 600)
  // ─────────────────────────────────────────────────────────────
  try {
    const baseImgO1 = path.join(imgDir, "banner-streetwear-tee.jpg");
    const outImgO1 = path.join(imgDir, "crazymonk-offer-tees.jpg");

    const svgOverlayO1 = `
    <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrimO1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#090d16" stop-opacity="0.94"/>
          <stop offset="55%" stop-color="#090d16" stop-opacity="0.75"/>
          <stop offset="85%" stop-color="#090d16" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#090d16" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="600" fill="url(#scrimO1)"/>

      <g transform="translate(60, 70)">
        <rect x="0" y="0" width="230" height="36" rx="18" fill="rgba(250, 167, 3, 0.2)" stroke="#faa703" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="5" fill="#faa703"/>
        <text x="34" y="24" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="2">
          ⚡ CRAZY DEAL
        </text>
      </g>

      <g transform="translate(60, 175)">
        <text x="0" y="0" font-family="'Impact', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="2">
          OVERSIZED TEES
        </text>
        <text x="0" y="65" font-family="'Impact', Arial, sans-serif" font-size="64" font-weight="900" fill="#faa703" letter-spacing="2">
          BUY 2 @ ₹999
        </text>
      </g>

      <g transform="translate(60, 290)">
        <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="600" fill="#94a3b8">
          Heavyweight 240+ GSM pure combed cotton with drop-shoulder fit.
        </text>
      </g>

      <!-- Stamp Badge -->
      <g transform="translate(60, 340)">
        <rect x="0" y="0" width="340" height="58" rx="12" fill="#faa703"/>
        <text x="24" y="38" font-family="'Impact', Arial, sans-serif" font-size="26" font-weight="900" fill="#0f172a" letter-spacing="2">
          FLAT 25% OFF · CODE: FREESHIP
        </text>
      </g>
    </svg>
    `;

    await sharp(baseImgO1)
      .resize(1200, 600, { fit: "cover", position: "right" })
      .composite([{ input: Buffer.from(svgOverlayO1), top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toFile(outImgO1);

    console.log("✅ Offer Banner 1 created:", outImgO1);
  } catch (err) {
    console.error("❌ Failed to create Offer Banner 1:", err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Offers Banner 2: Heavyweight Hoodies & Fleece Shop (1200 x 600)
  // ─────────────────────────────────────────────────────────────
  try {
    const baseImgO2 = path.join(imgDir, "banner-streetwear-hoodie.jpg");
    const outImgO2 = path.join(imgDir, "crazymonk-offer-hoodies.jpg");

    const svgOverlayO2 = `
    <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrimO2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#090d16" stop-opacity="0.94"/>
          <stop offset="55%" stop-color="#090d16" stop-opacity="0.75"/>
          <stop offset="85%" stop-color="#090d16" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#090d16" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="600" fill="url(#scrimO2)"/>

      <g transform="translate(60, 70)">
        <rect x="0" y="0" width="240" height="36" rx="18" fill="rgba(220, 38, 38, 0.2)" stroke="#dc2626" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="5" fill="#dc2626"/>
        <text x="34" y="24" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="2">
          🔥 WINTER DROP
        </text>
      </g>

      <g transform="translate(60, 175)">
        <text x="0" y="0" font-family="'Impact', Arial, sans-serif" font-size="62" font-weight="900" fill="#ffffff" letter-spacing="2">
          WINTER HOODIE SHOP
        </text>
        <text x="0" y="65" font-family="'Impact', Arial, sans-serif" font-size="62" font-weight="900" fill="#ff4d4d" letter-spacing="2">
          BUY 1 GET 1 50% OFF
        </text>
      </g>

      <g transform="translate(60, 290)">
        <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="600" fill="#94a3b8">
          450 GSM winter brushed fleece hoodies built for street style and warmth.
        </text>
      </g>

      <!-- Stamp Badge -->
      <g transform="translate(60, 340)">
        <rect x="0" y="0" width="370" height="58" rx="12" fill="#dc2626"/>
        <text x="24" y="38" font-family="'Impact', Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="2">
          450 GSM FLEECE · LIMITED UNITS
        </text>
      </g>
    </svg>
    `;

    await sharp(baseImgO2)
      .resize(1200, 600, { fit: "cover", position: "right" })
      .composite([{ input: Buffer.from(svgOverlayO2), top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toFile(outImgO2);

    console.log("✅ Offer Banner 2 created:", outImgO2);
  } catch (err) {
    console.error("❌ Failed to create Offer Banner 2:", err.message);
  }
}

generateBanners().then(() => {
  console.log("🎉 All CrazyMonk Streetwear Banners successfully generated!");
  process.exit(0);
}).catch(err => {
  console.error("Error generating banners:", err);
  process.exit(1);
});
