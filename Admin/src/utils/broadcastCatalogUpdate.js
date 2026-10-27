/**
 * Cross-tab synchronization utility for Admin panel.
 * Broadcasts updates to the storefront immediately when products, categories,
 * subcategories, or banners are modified or deleted.
 */

export function broadcastCatalogUpdate(payload = {}) {
  const data = {
    type: "CATALOG_UPDATED",
    timestamp: Date.now(),
    ...payload
  };
  try {
    const channel = new BroadcastChannel("hd_catalog_channel");
    channel.postMessage(data);
    channel.close();
  } catch {}
  try {
    localStorage.setItem("hd_catalog_updated_at", String(Date.now()));
  } catch {}
}
