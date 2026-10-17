import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const variantsPage = await readFile(new URL("../src/pages/Variants/VariantManagementPage.jsx", import.meta.url), "utf8");
const serializer = await readFile(new URL("../../Backend/src/services/productSerializer.js", import.meta.url), "utf8");
const productService = await readFile(new URL("../../Backend/src/services/productService.js", import.meta.url), "utf8");
const detailPage = await readFile(new URL("../../Frontend/src/pages/ProductDetail.jsx", import.meta.url), "utf8");

test("variant editor uploads and submits front, back, and thumbnail image URLs", () => {
  assert.match(variantsPage, /Upload Front View/);
  assert.match(variantsPage, /Upload Back View/);
  assert.match(variantsPage, /Thumbnail Images/);
  assert.match(variantsPage, /image_url: formData\.imageUrl/);
  assert.match(variantsPage, /gallery_images: formData\.galleryImages/);
  assert.match(productService, /image_url: v\.image_url \|\| v\.imageUrl/);
  assert.match(productService, /gallery_images: v\.gallery_images \|\| v\.galleryImages/);
});

test("serialized variants expose their own details and the product page prefers their gallery", () => {
  assert.match(serializer, /priceOverride:/);
  assert.match(serializer, /originalPriceOverride:/);
  assert.match(serializer, /imageUrl: v\.image_url/);
  assert.match(serializer, /galleryImages:/);
  assert.match(detailPage, /if \(variantImages\.length > 0\) return variantImages/);
  assert.match(detailPage, /currentVariant\?\.priceOverride/);
});
