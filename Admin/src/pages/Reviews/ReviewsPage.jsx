import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { reviewsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/DataTable/DataTable";

function parseImageUrls(urls) {
  if (Array.isArray(urls)) return urls;
  if (typeof urls === "string") {
    try {
      const parsed = JSON.parse(urls);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export default function ReviewsPage() {
  const [rows, setRows] = useState([]);
  const [approved, setApproved] = useState("false");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const result = await reviewsApi.list({ approved });
      setRows(result.data || []);
    } catch (error) {
      toast.error(error.message || "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [approved]);

  async function setPublished(row, value) {
    try {
      await reviewsApi.update(row.id, { action: value ? "publish" : "reject" });
      toast.success(value ? "Review published" : "Review rejected");
      load();
    } catch (error) { toast.error(error.message || "Could not update review"); }
  }

  async function edit(row) {
    const comment = window.prompt("Edit review text", row.comment || "");
    if (comment === null) return;
    try {
      await reviewsApi.update(row.id, { comment });
      toast.success("Review updated");
      load();
    } catch (error) { toast.error(error.message || "Could not update review"); }
  }

  async function remove(row) {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      await reviewsApi.remove(row.id);
      toast.success("Review deleted");
      load();
    } catch (error) { toast.error(error.message || "Could not delete review"); }
  }

  return <div>
    <div className="page-header"><div><h1 className="page-title">Product Reviews</h1><p className="page-subtitle">Review customer feedback before it appears on product pages.</p></div></div>
    <div className="card">
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", flexWrap: "wrap" }}>
        <button className={`btn ${approved === "false" ? "btn-primary" : "btn-secondary"}`} onClick={() => setApproved("false")}>Needs review</button>
        <button className={`btn ${approved === "true" ? "btn-primary" : "btn-secondary"}`} onClick={() => setApproved("true")}>Published</button>
        <button className={`btn ${approved === "" ? "btn-primary" : "btn-secondary"}`} onClick={() => setApproved("")}>All</button>
      </div>
      <DataTable isLoading={loading} rows={rows} rowKey={(row) => row.id} emptyTitle="No reviews" emptyDescription="Customer reviews will appear here." columns={[
        { key: "product", label: "Product", render: (row) => <div><strong>{row.product?.name || "Product"}</strong><div className="cell-muted">{row.customer_name} · {row.customer_email || ""}</div></div> },
        { key: "rating", label: "Rating", width: "90px", render: (row) => "★".repeat(Number(row.rating) || 0) },
        { key: "comment", label: "Review", render: (row) => <div style={{ maxWidth: 420 }}><strong>{row.title}</strong><div>{row.comment}</div>{parseImageUrls(row.image_urls).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>Photo</a>)}</div> },
        { key: "actions", label: "Actions", align: "right", render: (row) => <div className="table-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => edit(row)}>Edit</button>
          <button className="btn btn-secondary btn-sm" title={row.is_approved ? "Reject" : "Publish"} onClick={() => setPublished(row, !row.is_approved)}>{row.is_approved ? <><EyeOff size={14} /> Reject</> : <><Check size={14} /> Publish</>}</button>
          <button className="btn btn-secondary btn-sm" onClick={() => remove(row)}><Trash2 size={14} /> Delete</button>
        </div> }
      ]} />
    </div>
  </div>;
}
