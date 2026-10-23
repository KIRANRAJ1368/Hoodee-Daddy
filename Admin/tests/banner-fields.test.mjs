import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const categoryModalPath = path.resolve(here, "../src/pages/Categories/CategoryFormModal.jsx");
const bannerModalPath = path.resolve(here, "../src/pages/Banners/BannerFormModal.jsx");

test("Hero Banner and Categories Banner are simplified with pure image uploads and zero unwanted text overlay fields", () => {
  const categoryModalContent = fs.readFileSync(categoryModalPath, "utf8");
  const bannerModalContent = fs.readFileSync(bannerModalPath, "utf8");

  // Category Modal must contain:
  // 1. Category Name
  assert.ok(categoryModalContent.includes('label="Category Name *"'), "Category Modal must have Category Name *");
  // 2. URL Slug
  assert.ok(categoryModalContent.includes('label="URL Slug"'), "Category Modal must have URL Slug");
  // 3. Display Order Sequence
  assert.ok(categoryModalContent.includes('label="Display Order Sequence"'), "Category Modal must have Display Order Sequence");
  // 4. Short Description
  assert.ok(categoryModalContent.includes('label="Short Description"'), "Category Modal must have Short Description");
  // 5. Collection Page Hero Banner
  assert.ok(categoryModalContent.includes('label="Collection Page Hero Banner"'), "Category Modal must have Collection Page Hero Banner");
  // 6. Active checkbox
  assert.ok(categoryModalContent.includes('Active & Visible in Navbar'), "Category Modal must have Active checkbox");
  // 7. Show Category on Homepage checkbox
  assert.ok(categoryModalContent.includes('Show Category Carousel on Homepage'), "Category Modal must have Show Category Carousel checkbox");

  // Category Modal must NOT contain unwanted text overlay fields
  assert.equal(categoryModalContent.includes('label="Tagline / Eyebrow Text"'), false, "Category Modal must not have Tagline field");
  assert.equal(categoryModalContent.includes('label="Promo Badge Tag"'), false, "Category Modal must not have Promo Badge field");
  assert.equal(categoryModalContent.includes('label="Headline Title"'), false, "Category Modal must not have Headline Title field");
  assert.equal(categoryModalContent.includes('label="Primary CTA Text"'), false, "Category Modal must not have CTA text field");

  // Hero Banner form must have simplified inputs for hero banners
  assert.ok(bannerModalContent.includes('label="Banner Placement *"'), "Banner Modal must have Banner Placement");
  assert.ok(bannerModalContent.includes('label="Display Order Sequence"'), "Banner Modal must have Display Order Sequence");
  assert.ok(bannerModalContent.includes('label="Banner Image *"'), "Banner Modal must have Banner Image");
  assert.ok(bannerModalContent.includes('isHeroPlacement'), "Banner Modal must conditionally simplify for hero banners");
});
