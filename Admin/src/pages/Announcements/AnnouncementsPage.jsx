import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Megaphone, Eye, CheckCircle2, XCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { announcementsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import AnnouncementFormModal from "./AnnouncementFormModal";
import "./AnnouncementsPage.css";

export default function AnnouncementsPage() {
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  function broadcastAnnouncementUpdate(actionType) {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("hd_catalog_channel");
        bc.postMessage({ action: actionType, timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  }

  async function loadAnnouncement() {
    setIsLoading(true);
    try {
      const res = await announcementsApi.list();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAnnouncement(list[0] || null);
    } catch (err) {
      toast.error(err.message || "Failed to load announcement");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncement();
  }, []);

  async function handleToggle() {
    if (!announcement?.id) return;
    try {
      await announcementsApi.toggle(announcement.id);
      toast.success(
        `Announcement ${!announcement.is_active ? "enabled and active on website" : "disabled and hidden from website"}`
      );
      broadcastAnnouncementUpdate("ANNOUNCEMENT_TOGGLED");
      loadAnnouncement();
    } catch (err) {
      toast.error(err.message || "Failed to update announcement status");
    }
  }

  async function handleDelete() {
    if (!announcement?.id) return;
    const ok = await confirm({
      title: "Remove Announcement?",
      message: "Are you sure you want to remove this top announcement? The website navbar will sit at the very top."
    });

    if (!ok) return;

    try {
      await announcementsApi.remove(announcement.id);
      toast.success("Announcement removed");
      broadcastAnnouncementUpdate("ANNOUNCEMENT_DELETED");
      setAnnouncement(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete announcement");
    }
  }

  return (
    <div className="announcements-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "rgba(255, 115, 0, 0.12)",
                color: "#ff7300",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
                Top Announcement Bar
              </h1>
              <p className="page-subtitle" style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                Manage the promotional orange announcement bar displayed at the very top of the website
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-accent"
          onClick={() => setShowModal(true)}
        >
          {announcement ? <Edit2 size={16} /> : <Plus size={16} />}
          <span>{announcement ? "Edit Announcement" : "Add Announcement"}</span>
        </button>
      </div>

      {/* Live Storefront Preview */}
      <div className="card" style={{ marginBottom: 24, padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#334155" }}>
            <Eye size={16} />
            <span>Live Storefront Visual Simulation</span>
          </div>
          {announcement && announcement.is_active ? (
            <span className="pill-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontSize: 11, fontWeight: 700 }}>
              ● LIVE & ACTIVE ON WEBSITE
            </span>
          ) : (
            <span className="pill-badge" style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", fontSize: 11, fontWeight: 700 }}>
              ○ DISABLED / HIDDEN
            </span>
          )}
        </div>

        {announcement && announcement.is_active ? (
          <div
            style={{
              backgroundColor: "#FF6700",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "10px 48px 10px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "0.03em",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(255, 103, 0, 0.25)",
              minHeight: 42,
              overflow: "hidden"
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span>{announcement.message}</span>
              {announcement.link_url && (
                <span style={{ opacity: 0.9 }}>&rarr;</span>
              )}
            </div>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12
              }}
              title="Close button preview"
            >
              ✕
            </span>
          </div>
        ) : (
          <div
            style={{
              padding: "16px 20px",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              color: "#64748b",
              textAlign: "center"
            }}
          >
            {announcement
              ? "The announcement is currently disabled. Toggle it active to display the orange announcement bar on the storefront."
              : "No announcement is configured yet. Click \"Add Announcement\" to show a promotional orange bar at the top of the website."}
          </div>
        )}
      </div>

      {/* Single Announcement Management Details Card */}
      <div className="card" style={{ padding: "24px" }}>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading announcement...
          </div>
        ) : announcement ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Storefront Announcement Configuration
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
                  Single dynamic announcement displayed across all pages
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleToggle}
                  className="status-toggle-btn"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0
                  }}
                  title={`Click to ${announcement.is_active ? "disable" : "enable"}`}
                >
                  {announcement.is_active ? (
                    <span
                      className="pill-badge"
                      style={{
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        fontSize: 12.5,
                        fontWeight: 700
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Active & Displaying</span>
                    </span>
                  ) : (
                    <span
                      className="pill-badge"
                      style={{
                        background: "#f8fafc",
                        color: "#94a3b8",
                        border: "1px solid #e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        fontSize: 12.5,
                        fontWeight: 700
                      }}
                    >
                      <XCircle size={14} />
                      <span>Disabled</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                  Announcement Message
                </span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.45 }}>
                  {announcement.message}
                </p>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                  Redirect Destination Link
                </span>
                {announcement.link_url ? (
                  <a
                    href={announcement.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#2563eb",
                      fontSize: 13.5,
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
                  >
                    <span>{announcement.link_url}</span>
                    <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <span style={{ fontSize: 13, color: "#64748b" }}>None (Text Only — Not clickable)</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => setShowModal(true)}
              >
                <Edit2 size={15} />
                <span>Edit Message & Link</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDelete}
                style={{ color: "#dc2626" }}
              >
                <Trash2 size={15} />
                <span>Remove Announcement</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255, 115, 0, 0.12)", color: "#ff7300", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Megaphone size={24} />
            </div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700 }}>No Top Announcement Added</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
              Add an orange top announcement bar to promote sales, free shipping, or special discounts on the website.
            </p>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              <span>Add Announcement</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <AnnouncementFormModal
          announcement={announcement}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadAnnouncement();
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmModal />
    </div>
  );
}
