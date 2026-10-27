import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Globe,
  FolderTree,
  Tags,
  Shirt,
  X,
  CheckCircle2,
  Percent
} from "lucide-react";
import { offersApi, productsApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";

function toLocalDatetimeInput(dateObj) {
  const d = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

const defaultDates = () => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    starts_at: toLocalDatetimeInput(now),
    ends_at: toLocalDatetimeInput(nextWeek)
  };
};

const blankForm = () => ({
  name: "",
  target_type: "all", // 'all' | 'category' | 'product'
  target_ids: [],
  discount_type: "percentage",
  discount_value: "",
  ...defaultDates(),
  is_active: true
});

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(blankForm());
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Filter state for Particular Product selection
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [search, setSearch] = useState("");

  const toast = useToast();

  async function load() {
    try {
      const [o, p, c] = await Promise.all([
        offersApi.list(),
        productsApi.list({ limit: 200 }),
        categoriesApi.list({ includeInactive: false }),
      ]);
      setOffers(o.data || []);
      setProducts(p.data || []);
      setCategories(c.data || []);
    } catch (e) {
      toast.error(e.message || "Could not load offers");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Products filtered by Category -> Search
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryId) {
      list = list.filter(
        (p) => Number(p.categoryId ?? p.category_id) === Number(selectedCategoryId)
      );
    }
    if (search.trim() && form.target_type === "product") {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategoryId, search, form.target_type]);

  // Categories filtered by search when in 'category' mode
  const filteredCategories = useMemo(() => {
    if (!search.trim() || form.target_type !== "category") return categories;
    const q = search.trim().toLowerCase();
    return categories.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [categories, search, form.target_type]);

  function handleTargetTypeChange(nextType) {
    setForm((prev) => ({
      ...prev,
      target_type: nextType,
      target_ids: []
    }));
    setSelectedCategoryId("");
    setSearch("");
  }

  function toggleTargetId(id) {
    const numId = Number(id);
    if (!numId) return;
    setForm((prev) => ({
      ...prev,
      target_ids: prev.target_ids.includes(numId)
        ? prev.target_ids.filter((x) => x !== numId)
        : [...prev.target_ids, numId]
    }));
  }

  function addTargetFromDropdown(id) {
    const numId = Number(id);
    if (!numId) return;
    setForm((prev) => ({
      ...prev,
      target_ids: prev.target_ids.includes(numId)
        ? prev.target_ids
        : [...prev.target_ids, numId]
    }));
  }

  function selectAllCurrentTargets(items) {
    const ids = items.map((item) => Number(item.id)).filter(Boolean);
    setForm((prev) => {
      const merged = Array.from(new Set([...prev.target_ids, ...ids]));
      return { ...prev, target_ids: merged };
    });
  }

  function clearSelectedTargets() {
    setForm((prev) => ({ ...prev, target_ids: [] }));
  }

  function handleEdit(offer) {
    const parsedIds = Array.isArray(offer.target_ids)
      ? offer.target_ids.map(Number)
      : (() => {
          try {
            return JSON.parse(offer.target_ids || "[]").map(Number);
          } catch {
            return [];
          }
        })();

    setEditingId(offer.id);
    setForm({
      name: offer.name || "",
      target_type: offer.target_type || "product",
      target_ids: parsedIds,
      discount_type: offer.discount_type || "percentage",
      discount_value: String(offer.discount_value || ""),
      starts_at: offer.starts_at ? toLocalDatetimeInput(new Date(offer.starts_at)) : defaultDates().starts_at,
      ends_at: offer.ends_at ? toLocalDatetimeInput(new Date(offer.ends_at)) : defaultDates().ends_at,
      is_active: offer.is_active !== false
    });
    setSelectedCategoryId("");
    setSearch("");
    setOpen(true);
  }

  function handleOpenCreate() {
    setEditingId(null);
    setForm(blankForm());
    setSelectedCategoryId("");
    setSearch("");
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (form.target_type !== "all" && form.target_ids.length === 0) {
      toast.error(
        form.target_type === "category"
          ? "Please select at least one Category."
          : "Please select at least one Particular Product."
      );
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        target_ids: form.target_type === "all" ? [] : form.target_ids.map(Number),
        discount_value: Number(form.discount_value),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString()
      };

      if (editingId) {
        await offersApi.update(editingId, payload);
        toast.success(`Offer "${form.name}" updated successfully!`);
      } else {
        await offersApi.create(payload);
        toast.success(`Offer "${form.name}" created successfully!`);
      }

      setForm(blankForm());
      setEditingId(null);
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message || "Offer could not be saved");
    } finally {
      setBusy(false);
    }
  }

  async function toggleOffer(offer) {
    try {
      await offersApi.update(offer.id, { is_active: !offer.is_active });
      toast.success(`Offer "${offer.name}" ${!offer.is_active ? "activated" : "deactivated"}.`);
      await load();
    } catch (e) {
      toast.error(e.message);
      await load();
    }
  }

  async function remove(offer) {
    if (!window.confirm(`Delete offer “${offer.name}”?`)) return;
    try {
      await offersApi.remove(offer.id);
      toast.delete(`Offer "${offer.name}" deleted.`);
      await load();
    } catch (e) {
      toast.error(e.message);
      await load();
    }
  }

  function getCategoryName(catId) {
    return categories.find((c) => Number(c.id) === Number(catId))?.name || `Category #${catId}`;
  }

  function getProductName(prodId) {
    const prod = products.find((p) => Number(p.id) === Number(prodId));
    return prod ? `${prod.name} (₹${prod.originalPrice || prod.price})` : `Product #${prodId}`;
  }

  function renderOfferTargetSummary(offer) {
    const ids = Array.isArray(offer.target_ids) ? offer.target_ids : [];
    if (offer.target_type === "all") {
      return `Overall Shop — All Active Products (${products.length} products)`;
    }
    if (offer.target_type === "category") {
      const names = ids.map(getCategoryName);
      return `Category Offer (${ids.length}): ${names.join(", ") || "None"}`;
    }
    const names = ids.slice(0, 4).map(getProductName);
    const extra = ids.length > 4 ? ` +${ids.length - 4} more` : "";
    return `Particular Product Offer (${ids.length}): ${names.join(", ")}${extra}`;
  }

  function calculatePreviewPrice(product) {
    const mrp = Number(product.originalPrice || product.price || 0);
    const val = Number(form.discount_value || 0);
    if (!val || val <= 0) return mrp;
    const cut = form.discount_type === "percentage" ? (mrp * val) / 100 : val;
    return Math.max(1, Math.round((mrp - cut) * 100) / 100);
  }

  const canSubmit =
    !busy &&
    form.name.trim().length > 0 &&
    Number(form.discount_value) > 0 &&
    (form.target_type === "all" || form.target_ids.length > 0);

  return (
    <div className="offers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Product &amp; Shop Offers</span>
            <span className="pill-badge badge-gold">{offers.length} Offer{offers.length === 1 ? "" : "s"}</span>
          </h1>
          <p className="page-subtitle">
            Set flexible discounts across the Overall Shop, specific Categories, or Particular Products with automatic dropdown selection.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => (open ? setOpen(false) : handleOpenCreate())}
        >
          <Plus size={16} />
          <span>{open ? "Close Form" : "Create Offer"}</span>
        </button>
      </div>

      {open && (
        <form className="card offer-form" onSubmit={save}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>
              {editingId ? `Edit Offer — ${form.name}` : "Create Flexible Offer"}
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>

          {/* 1. Offer Scope / Target Type Selector Cards */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
              1. Choose How You Want to Apply This Offer *
            </div>
            <div className="offer-type-cards">
              <button
                type="button"
                className={`offer-type-card ${form.target_type === "all" ? "active" : ""}`}
                onClick={() => handleTargetTypeChange("all")}
              >
                <Globe size={18} />
                <div>
                  <strong>Overall Shop</strong>
                  <span>All Products in Store</span>
                </div>
              </button>

              <button
                type="button"
                className={`offer-type-card ${form.target_type === "category" ? "active" : ""}`}
                onClick={() => handleTargetTypeChange("category")}
              >
                <FolderTree size={18} />
                <div>
                  <strong>Category Wise</strong>
                  <span>Men, Women, Boys, Girls, Babies</span>
                </div>
              </button>



              <button
                type="button"
                className={`offer-type-card ${form.target_type === "product" ? "active" : ""}`}
                onClick={() => handleTargetTypeChange("product")}
              >
                <Shirt size={18} />
                <div>
                  <strong>Particular Product</strong>
                  <span>Category → Product</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Offer Name & Discount Configuration */}
          <div className="offer-grid-4">
            <label style={{ gridColumn: "span 2" }}>
              Offer Name / Title *
              <input
                required
                placeholder="e.g. Festive Mega Sale 25% Off"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Discount Type *
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </label>

            <label>
              Discount Value ({form.discount_type === "percentage" ? "%" : "₹"}) *
              <input
                type="number"
                min="0.01"
                max={form.discount_type === "percentage" ? 99 : undefined}
                step="0.01"
                required
                placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 250"}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />
            </label>
          </div>

          {/* 3. Dynamic Cascading Dropdowns & Target Selection */}
          <div className="offer-target-box">
            {/* MODE A: OVERALL SHOP */}
            {form.target_type === "all" && (
              <div className="overall-shop-banner">
                <CheckCircle2 size={22} style={{ color: "#059669", flexShrink: 0 }} />
                <div>
                  <strong>Overall Shop Offer Enabled (All Products)</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#065f46" }}>
                    This offer will automatically apply to all <strong>{products.length}</strong> active products across Men, Women, Boys, Girls, and Babies collections (including any new products added while the offer is active).
                  </p>
                </div>
              </div>
            )}

            {/* MODE B: CATEGORY WISE */}
            {form.target_type === "category" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div className="offer-cascade-row">
                  <label style={{ flex: 1 }}>
                    Automatic Category Dropdown (Select to Add)
                    <select
                      value=""
                      onChange={(e) => addTargetFromDropdown(e.target.value)}
                    >
                      <option value="">-- Choose a Category to Add ({categories.length} available) --</option>
                      {categories.map((cat) => {
                        const count = products.filter(
                          (p) => Number(p.categoryId ?? p.category_id) === Number(cat.id)
                        ).length;
                        const isSelected = form.target_ids.includes(Number(cat.id));
                        return (
                          <option key={cat.id} value={cat.id}>
                            {isSelected ? "✓ " : ""}{cat.name} ({count} product{count === 1 ? "" : "s"})
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <div className="cascade-quick-btns">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => selectAllCurrentTargets(categories)}
                    >
                      Select All Categories
                    </button>
                    {form.target_ids.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={clearSelectedTargets}
                      >
                        Clear ({form.target_ids.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Category Chips */}
                {form.target_ids.length > 0 && (
                  <div className="selected-pills">
                    {form.target_ids.map((id) => (
                      <span key={id} className="selected-pill">
                        <span>{getCategoryName(id)}</span>
                        <button type="button" onClick={() => toggleTargetId(id)} title="Remove">
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Checkbox List */}
                <div className="offer-target-list">
                  {filteredCategories.map((cat) => {
                    const chosen = form.target_ids.includes(Number(cat.id));
                    const count = products.filter(
                      (p) => Number(p.categoryId ?? p.category_id) === Number(cat.id)
                    ).length;
                    return (
                      <label key={cat.id} className={chosen ? "chosen-row" : ""}>
                        <input
                          type="checkbox"
                          checked={chosen}
                          onChange={() => toggleTargetId(cat.id)}
                        />
                        <span><strong>{cat.name}</strong></span>
                        <small style={{ color: "#475569" }}>{count} product{count === 1 ? "" : "s"}</small>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}



            {/* MODE C: PARTICULAR PRODUCT (Category -> Automatic Product Dropdown) */}
            {form.target_type === "product" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div className="offer-cascade-row">
                  <label style={{ flex: 1 }}>
                    Filter by Category
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                      }}
                    >
                      <option value="">All Categories ({categories.length})</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>



                  <label style={{ flex: 1.6 }}>
                    Automatic Particular Product Dropdown (Select to Add) *
                    <select
                      value=""
                      onChange={(e) => addTargetFromDropdown(e.target.value)}
                    >
                      <option value="">
                        -- Choose a Particular Product to Add ({filteredProducts.length} available) --
                      </option>
                      {filteredProducts.map((prod) => {
                        const isSelected = form.target_ids.includes(Number(prod.id));
                        const mrp = Number(prod.originalPrice || prod.price || 0);
                        return (
                          <option key={prod.id} value={prod.id}>
                            {isSelected ? "✓ " : ""}{prod.name} — ₹{mrp} ({prod.sku || `#${prod.id}`})
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <input
                    style={{ flex: 1, minWidth: 220 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product by name or SKU..."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => selectAllCurrentTargets(filteredProducts)}
                  >
                    Select All Matching Products ({filteredProducts.length})
                  </button>
                  {form.target_ids.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={clearSelectedTargets}
                    >
                      Clear Selected ({form.target_ids.length})
                    </button>
                  )}
                </div>

                {/* Selected Particular Product Pills with Live Offer Price Preview */}
                {form.target_ids.length > 0 && (
                  <div className="selected-pills">
                    {form.target_ids.map((id) => {
                      const prod = products.find((p) => Number(p.id) === Number(id));
                      const mrp = prod ? Number(prod.originalPrice || prod.price || 0) : 0;
                      const offerPrice = prod ? calculatePreviewPrice(prod) : 0;
                      return (
                        <span key={id} className="selected-pill">
                          <span>
                            <strong>{prod?.name || `Product #${id}`}</strong>
                            {prod && Number(form.discount_value) > 0 && (
                              <em style={{ marginLeft: 6, fontStyle: "normal", color: "#047857" }}>
                                ₹{mrp} → ₹{offerPrice}
                              </em>
                            )}
                          </span>
                          <button type="button" onClick={() => toggleTargetId(id)} title="Remove">
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Product Checkbox List */}
                <div className="offer-target-list">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => {
                      const chosen = form.target_ids.includes(Number(prod.id));
                      const mrp = Number(prod.originalPrice || prod.price || 0);
                      const preview = calculatePreviewPrice(prod);
                      return (
                        <label key={prod.id} className={chosen ? "chosen-row" : ""}>
                          <input
                            type="checkbox"
                            checked={chosen}
                            onChange={() => toggleTargetId(prod.id)}
                          />
                          <span>
                            <strong>{prod.name}</strong>{" "}
                            <span style={{ color: "#64748b", fontSize: 12 }}>
                              ({prod.sku || `#${prod.id}`})
                            </span>
                          </span>
                          <small style={{ color: "#0f172a", fontWeight: 600 }}>
                            ₹{mrp}
                            {Number(form.discount_value) > 0 && preview < mrp ? (
                              <span style={{ color: "#059669", marginLeft: 6 }}>
                                → ₹{preview}
                              </span>
                            ) : null}
                          </small>
                        </label>
                      );
                    })
                  ) : (
                    <div style={{ padding: 16, color: "#64748b", fontSize: 13 }}>
                      No products match the selected Category filter.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Schedule Dates */}
          <div className="offer-grid-2">
            <label>
              Starts At *
              <input
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </label>
            <label>
              Ends At *
              <input
                type="datetime-local"
                required
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </label>
          </div>

          <div className="offer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={!canSubmit}>
              <Percent size={15} />
              <span>{busy ? "Saving…" : editingId ? "Update Offer" : "Save & Activate Offer"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Active & Scheduled Offers Table */}
      <div className="card offer-table">
        {offers.length ? (
          offers.map((o) => (
            <article key={o.id}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15 }}>{o.name}</strong>
                  <span className="offer-badge-discount">
                    {o.discount_type === "percentage"
                      ? `${Number(o.discount_value)}% OFF`
                      : `FLAT ₹${Number(o.discount_value)} OFF`}
                  </span>
                  <span className={`offer-status ${o.status}`}>{o.status}</span>
                </div>
                <p style={{ margin: "6px 0 4px 0", fontSize: 13, color: "#334155", fontWeight: 500 }}>
                  {renderOfferTargetSummary(o)}
                </p>
                <small style={{ color: "#64748b" }}>
                  Valid: {new Date(o.starts_at).toLocaleString()} → {new Date(o.ends_at).toLocaleString()}
                </small>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleEdit(o)}
                  title="Edit Offer"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title={o.is_active ? "Deactivate Offer" : "Activate Offer"}
                  onClick={() => toggleOffer(o)}
                >
                  {o.is_active ? <ToggleRight size={18} color="#059669" /> : <ToggleLeft size={18} color="#64748b" />}
                  <span>{o.is_active ? "Active" : "Paused"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  title="Delete Offer"
                  onClick={() => remove(o)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="offer-empty">
            <p style={{ margin: "0 0 10px 0", fontSize: 14 }}>
              No product or shop offers created yet. Click <strong>Create Offer</strong> to set an Overall Shop, Category, or Particular Product discount.
            </p>
            <button type="button" className="btn btn-accent" onClick={handleOpenCreate}>
              <Plus size={15} />
              <span>Create First Offer</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .offers-page { max-width: 1180px; }
        .offer-form { padding: 24px; margin-bottom: 24px; display: grid; gap: 18px; }
        .offer-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; color: #1e293b; }
        .offer-form input:not([type=checkbox]), .offer-form select {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          background: #ffffff;
        }
        .offer-type-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .offer-type-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .offer-type-card div { display: grid; gap: 2px; }
        .offer-type-card strong { font-size: 13.5px; color: #0f172a; }
        .offer-type-card span { font-size: 11.5px; color: #64748b; }
        .offer-type-card.active {
          border-color: #c5a059;
          background: #fdf8ee;
          box-shadow: 0 2px 8px rgba(197, 160, 89, 0.15);
        }
        .offer-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .offer-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .offer-target-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }
        .overall-shop-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          color: #065f46;
        }
        .offer-cascade-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cascade-quick-btns {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 2px;
        }
        .selected-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
        }
        .selected-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          background: #fdf8ee;
          border: 1px solid #e9d5a1;
          border-radius: 999px;
          font-size: 12px;
          color: #1e293b;
        }
        .selected-pill button {
          border: 0;
          background: none;
          cursor: pointer;
          color: #92400e;
          display: inline-flex;
          align-items: center;
          padding: 0;
        }
        .offer-target-list {
          max-height: 220px;
          overflow: auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .offer-target-list label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          font-weight: 500;
        }
        .offer-target-list label.chosen-row {
          background: #f0fdf4;
        }
        .offer-target-list small { margin-left: auto; }
        .offer-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .offer-table { padding: 6px 20px; }
        .offer-table article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 4px;
          border-bottom: 1px solid #f1f5f9;
        }
        .offer-table article:last-child { border-bottom: 0; }
        .offer-badge-discount {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .offer-status {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background: #f1f5f9;
        }
        .offer-status.active { background: #dcfce7; color: #166534; }
        .offer-status.scheduled { background: #e0f2fe; color: #075985; }
        .offer-status.inactive { color: #64748b; }
        .offer-empty { padding: 32px; text-align: center; color: #64748b; }
        @media (max-width: 860px) {
          .offer-type-cards, .offer-grid-4, .offer-grid-2 { grid-template-columns: 1fr; }
          .offer-table article { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
