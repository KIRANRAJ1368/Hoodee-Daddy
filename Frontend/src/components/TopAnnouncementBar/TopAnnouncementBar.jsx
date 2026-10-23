import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { storefrontApi } from "../../services/storefrontApi";
import { useShop } from "../../context/ShopContext";
import "./TopAnnouncementBar.css";

export default function TopAnnouncementBar() {
  const { homeData } = useShop();
  const [announcement, setAnnouncement] = useState(() => homeData?.activeAnnouncement || null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const barRef = useRef(null);

  // Sync when homeData is loaded/refreshed
  useEffect(() => {
    if (homeData?.activeAnnouncement) {
      setAnnouncement(homeData.activeAnnouncement);
    }
  }, [homeData?.activeAnnouncement]);

  // Fetch active announcement on mount and listen for real-time catalog broadcasts
  useEffect(() => {
    let isCancelled = false;

    async function loadAnnouncement() {
      try {
        const res = await storefrontApi.getActiveAnnouncement();
        if (!isCancelled && res) {
          const active = res.activeAnnouncement || (Array.isArray(res.announcements) ? res.announcements[0] : null);
          setAnnouncement(active || null);
        }
      } catch {
        // Fallback gracefully without breaking layout
      }
    }

    loadAnnouncement();

    // Cross-tab broadcast listener (when admin updates/toggles an announcement)
    let bc = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("zmw_catalog_channel");
        bc.onmessage = (event) => {
          if (event?.data?.action?.includes("ANNOUNCEMENT")) {
            loadAnnouncement();
            setIsDismissed(false);
          }
        };
      }
    } catch {}

    return () => {
      isCancelled = true;
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, []);

  // Check if this specific version was dismissed in current session
  useEffect(() => {
    if (announcement?.id) {
      const dismissKey = `zmw_announcement_dismissed_${announcement.id}_${announcement.updatedAt || ""}`;
      const dismissed = sessionStorage.getItem(dismissKey);
      setIsDismissed(Boolean(dismissed));
    }
  }, [announcement?.id, announcement?.updatedAt]);

  // Dynamically inform the header spacer of the announcement bar height
  useEffect(() => {
    if (!announcement || !announcement.is_active || isDismissed) {
      document.documentElement.style.setProperty("--announcement-bar-height", "0px");
      return;
    }

    const updateHeight = () => {
      if (barRef.current) {
        const h = barRef.current.offsetHeight || 38;
        document.documentElement.style.setProperty("--announcement-bar-height", `${h}px`);
      } else {
        document.documentElement.style.setProperty("--announcement-bar-height", "38px");
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      document.documentElement.style.setProperty("--announcement-bar-height", "0px");
    };
  }, [announcement, isDismissed]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClosing(true);
    document.documentElement.style.setProperty("--announcement-bar-height", "0px");

    setTimeout(() => {
      if (announcement?.id) {
        const dismissKey = `zmw_announcement_dismissed_${announcement.id}_${announcement.updatedAt || ""}`;
        sessionStorage.setItem(dismissKey, "true");
      }
      setIsDismissed(true);
      setIsClosing(false);
    }, 240);
  };

  if (!announcement || !announcement.is_active || isDismissed) {
    return null;
  }

  const hasLink = Boolean(announcement.link_url && announcement.link_url.trim());
  const isExternal = hasLink && /^https?:\/\//i.test(announcement.link_url);

  // Render a single marquee segment
  const renderSegment = (key) => {
    const itemContent = (
      <>
        <span className="top-announcement-text">{announcement.message}</span>
        {hasLink && (
          <span className="top-announcement-cta-badge">
            <span>Shop Now</span>
            <span aria-hidden="true">&rarr;</span>
          </span>
        )}
        <span className="top-announcement-sep" aria-hidden="true">✦</span>
      </>
    );

    if (hasLink) {
      return isExternal ? (
        <a
          key={key}
          href={announcement.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="top-announcement-item"
        >
          {itemContent}
        </a>
      ) : (
        <Link
          key={key}
          to={announcement.link_url}
          className="top-announcement-item"
        >
          {itemContent}
        </Link>
      );
    }

    return (
      <div key={key} className="top-announcement-item">
        {itemContent}
      </div>
    );
  };

  return (
    <aside
      ref={barRef}
      className={`top-announcement-bar ${isClosing ? "is-closing" : ""}`}
      role="region"
      aria-label="Promotional announcement ticker"
    >
      <div className={`top-announcement-marquee-wrapper ${hasLink ? "has-link" : ""}`}>
        {/* Track duplicated for continuous infinite smooth auto-scrolling */}
        <div className="top-announcement-marquee-track">
          {renderSegment("seg-1")}
          {renderSegment("seg-2")}
          {renderSegment("seg-3")}
          {renderSegment("seg-4")}
          {renderSegment("seg-5")}
          {renderSegment("seg-6")}
        </div>
      </div>

      {/* Dismiss / Close Button */}
      <button
        type="button"
        className="top-announcement-close-btn"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        title="Close announcement"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </aside>
  );
}
