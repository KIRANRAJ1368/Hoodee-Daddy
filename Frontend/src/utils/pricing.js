/**
 * Unified Pricing & Offer Engine for Storefront
 *
 * Requirements:
 * 1. Base price for offers is ALWAYS the product or variant MRP (originalPrice / original_price).
 *    If no MRP exists, fallback to regular price.
 * 2. When an offer is active:
 *    - Flat discount: final sales price = MRP - flatDiscount (e.g. MRP 500 - 200 = 300)
 *    - Percentage discount: final sales price = MRP - (MRP * percentage / 100)
 *    - Display: sales price is the reduced price, MRP is displayed crossed out.
 * 3. When an offer is expired (endsAt <= now) or inactive:
 *    - The offer is NOT applied and NOT displayed.
 *    - Price reverts cleanly to normal sales price (e.g. 400).
 *    - Display crossed-out MRP only if regular originalPrice > normal price.
 */

export function isOfferActive(offer) {
  if (!offer) return false;
  if (offer.isActive === false || offer.is_active === false) return false;

  const now = new Date();
  const startsAt = offer.startsAt || offer.starts_at;
  const endsAt = offer.endsAt || offer.ends_at;

  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) <= now) return false;

  return true;
}

export function getProductPricing(product, variant = null) {
  if (!product) {
    return {
      price: 0,
      originalPrice: null,
      mrp: 0,
      isOffer: false,
      offerBadge: null,
      savingsAmount: 0,
      savingsPercent: 0,
      endsAt: null
    };
  }

  // Normal sales price
  const normalPrice = Number(
    variant?.priceOverride ??
    variant?.price_override ??
    product.price ??
    0
  );

  // Normal MRP
  const normalMrp = Number(
    variant?.originalPriceOverride ??
    variant?.original_price_override ??
    product.originalPrice ??
    product.original_price ??
    0
  );

  // Offers apply on the MRP (baseMrp). If no MRP is set, fallback to normal sales price.
  const baseMrp = normalMrp > 0 ? normalMrp : normalPrice;

  const offer = product.offer;
  const active = isOfferActive(offer);

  if (active) {
    const discountType = offer.discountType ?? offer.discount_type ?? "percentage";
    const discountValue = Number(
      offer.discountValue ?? offer.discount_value ?? offer.discountPercent ?? 0
    );

    const cut = discountType === "percentage"
      ? (baseMrp * discountValue) / 100
      : discountValue;

    const offerPrice = Math.max(1, Math.round((baseMrp - cut) * 100) / 100);
    const savingsAmount = Math.max(0, Math.round((baseMrp - offerPrice) * 100) / 100);
    const savingsPercent = baseMrp > 0 ? Math.max(1, Math.round((savingsAmount / baseMrp) * 100)) : 0;

    const offerBadge = discountType === "flat"
      ? `FLAT ₹${discountValue} OFF`
      : `${savingsPercent}% OFF`;

    return {
      price: offerPrice,
      originalPrice: baseMrp > offerPrice ? baseMrp : null,
      mrp: baseMrp,
      isOffer: true,
      offerBadge,
      discountType,
      discountValue,
      savingsAmount,
      savingsPercent,
      endsAt: offer.endsAt ?? offer.ends_at ?? null
    };
  }

  // Offer inactive / expired / not present
  const hasRegularDiscount = normalMrp > normalPrice;
  const regSavings = hasRegularDiscount ? normalMrp - normalPrice : 0;
  const regPercent = hasRegularDiscount && normalMrp > 0 ? Math.round((regSavings / normalMrp) * 100) : 0;

  return {
    price: normalPrice,
    originalPrice: hasRegularDiscount ? normalMrp : null,
    mrp: normalMrp > 0 ? normalMrp : normalPrice,
    isOffer: false,
    offerBadge: hasRegularDiscount ? `${regPercent}% OFF` : null,
    savingsAmount: regSavings,
    savingsPercent: regPercent,
    endsAt: null
  };
}
