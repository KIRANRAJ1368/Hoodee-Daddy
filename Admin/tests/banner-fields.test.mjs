import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const categoryModalPath = path.resolve(here, "../src/pages/Categories/CategoryFormModal.jsx");
const bannerModalPath = path.resolve(here, "../src/pages/Banners/BannerFormModal.jsx");

test("Categories Banner matches Hero Banner fields and contains no extra input fields", () => {
  const categoryModalContent = fs.readFileSync(categoryModalPath, "utf8");
  const bannerModalContent = fs.readFileSync(bannerModalPath, "utf8");

  // Verify that the extra secondary CTA input field has been removed from Categories Banner
  assert.equal(
    categoryModalContent.includes('id="cat-b-cta2"'),
    false,
    "Categories Banner must not have cat-b-cta2 input"
  );
  assert.equal(
    categoryModalContent.includes("Secondary CTA / Urgency Tag"),
    false,
    "Categories Banner must not have Secondary CTA / Urgency Tag input field"
  );

  // Verify Categories Banner has the exact matching fields that are in Hero Banner
  // 1. Banner Image (ImageUploadField)
  assert.ok(
    categoryModalContent.includes('label="Banner Hero Image"') || categoryModalContent.includes('label="Banner Image"'),
    "Categories Banner must have ImageUploadField"
  );
  assert.ok(
    bannerModalContent.includes('label="Banner Image"'),
    "Hero Banner must have Banner Image field"
  );

  // 2. Tagline / Eyebrow Text
  assert.ok(
    categoryModalContent.includes('label="Tagline / Eyebrow Text"'),
    "Categories Banner must have Tagline / Eyebrow Text field"
  );
  assert.ok(
    bannerModalContent.includes('label="Tagline / Eyebrow Text"'),
    "Hero Banner must have Tagline / Eyebrow Text field"
  );

  // 3. Promo Badge Tag
  assert.ok(
    categoryModalContent.includes('label="Promo Badge Tag"'),
    "Categories Banner must have Promo Badge Tag field"
  );
  assert.ok(
    bannerModalContent.includes('label="Promo Badge Tag"'),
    "Hero Banner must have Promo Badge Tag field"
  );

  // 4. Headline Title
  assert.ok(
    categoryModalContent.includes("Headline Title"),
    "Categories Banner must have Headline Title field"
  );
  assert.ok(
    bannerModalContent.includes("Headline Title"),
    "Hero Banner must have Headline Title field"
  );

  // 5. Image Focal Position
  assert.ok(
    categoryModalContent.includes('label="Image Focal Position"'),
    "Categories Banner must have Image Focal Position field"
  );
  assert.ok(
    bannerModalContent.includes('label="Image Focal Position"'),
    "Hero Banner must have Image Focal Position field"
  );

  // 6. Subtitle / Description Copy
  assert.ok(
    categoryModalContent.includes("Subtitle / Description Copy"),
    "Categories Banner must have Subtitle / Description Copy field"
  );
  assert.ok(
    bannerModalContent.includes("Subtitle / Description Copy"),
    "Hero Banner must have Subtitle / Description Copy field"
  );

  // 7. Primary CTA Text
  assert.ok(
    categoryModalContent.includes('label="Primary CTA Text"'),
    "Categories Banner must have Primary CTA Text field"
  );
  assert.ok(
    bannerModalContent.includes('label="Primary CTA Text"'),
    "Hero Banner must have Primary CTA Text field"
  );
});
