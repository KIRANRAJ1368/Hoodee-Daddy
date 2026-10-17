import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_NAVIGATION } from "../src/layouts/adminNavigation.js";

test("sidebar navigation has a unique destination for every dashboard section", () => {
  const paths = ADMIN_NAVIGATION.map(({ to }) => to);
  assert.equal(paths.length, 18);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of ["/", "/banners", "/offer-banners", "/offers", "/categories", "/subcategories", "/products", "/variants", "/stock", "/coupons", "/reports", "/orders", "/reviews", "/shipping", "/customers", "/contact", "/seo", "/seo/sitemap"]) {
    assert.ok(paths.includes(path), `missing sidebar destination ${path}`);
  }
});

test("root route uses exact matching so it cannot mask other sidebar routes", () => {
  const root = ADMIN_NAVIGATION.find(({ to }) => to === "/");
  assert.equal(root.end, true);
});
