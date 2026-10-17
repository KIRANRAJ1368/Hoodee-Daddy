import { useState, useEffect, useRef } from "react";
import {
  Network,
  ExternalLink,
  RefreshCw,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Globe,
  FolderTree,
  Shirt,
  Layers,
  UploadCloud
} from "lucide-react";
import { seoApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState/LoadingState";
import Pagination from "../../components/Pagination/Pagination";
import "./SitemapPage.css";

export default function SitemapPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingSitemap, setIsUploadingSitemap] = useState(false);
  const [isUploadingRobots, setIsUploadingRobots] = useState(false);
  const sitemapFileInputRef = useRef(null);
  const robotsFileInputRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadSitemapData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  async function loadSitemapData() {
    setIsLoading(true);
    try {
      const res = await seoApi.getSitemapSummary();
      setSummary(res?.data || null);
    } catch (err) {
      toast.error(err.message || "Failed to load sitemap summary");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      await seoApi.syncSitemap();
      toast.success("XML Sitemap and robots.txt synchronized successfully");
      await loadSitemapData();
    } catch (err) {
      toast.error(err.message || "Failed to synchronize sitemap");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSitemapFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSitemap(true);
    try {
      await seoApi.uploadSitemap(file);
      toast.success("Custom sitemap.xml uploaded and published successfully");
      await loadSitemapData();
    } catch (err) {
      toast.error(err.message || "Failed to upload sitemap.xml");
    } finally {
      setIsUploadingSitemap(false);
      e.target.value = "";
    }
  }

  async function handleRobotsFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingRobots(true);
    try {
      await seoApi.uploadRobots(file);
      toast.success("Custom robots.txt uploaded and published successfully");
      await loadSitemapData();
    } catch (err) {
      toast.error(err.message || "Failed to upload robots.txt");
    } finally {
      setIsUploadingRobots(false);
      e.target.value = "";
    }
  }

  const entries = summary?.entries || [];

  const filteredEntries = entries.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.path && item.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.loc && item.loc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedEntries = filteredEntries.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="sitemap-page">
      {/* Top Header & Breadcrumbs matching reference */}
      <div className="sitemap-top-header">
        <div className="sitemap-header-left">
          <h1 className="sitemap-page-title">Sitemap Management</h1>
        </div>
        <div className="sitemap-header-breadcrumbs">
          <span className="crumb-group">SEO Settings</span>
          <span className="crumb-sep">&gt;</span>
          <span className="crumb-active">Sitemap</span>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading sitemap data..." />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="sitemap-stats-grid">
            <div className="sitemap-stat-card">
              <div className="sitemap-stat-icon-box total">
                <Globe size={22} />
              </div>
              <div className="sitemap-stat-info">
                <span className="sitemap-stat-value">{summary?.counts?.total || 0}</span>
                <span className="sitemap-stat-label">Total Indexable URLs</span>
              </div>
            </div>

            <div className="sitemap-stat-card">
              <div className="sitemap-stat-icon-box system">
                <FileCode size={22} />
              </div>
              <div className="sitemap-stat-info">
                <span className="sitemap-stat-value">{summary?.counts?.system || 0}</span>
                <span className="sitemap-stat-label">System & Policy Pages</span>
              </div>
            </div>

            <div className="sitemap-stat-card">
              <div className="sitemap-stat-icon-box category">
                <FolderTree size={22} />
              </div>
              <div className="sitemap-stat-info">
                <span className="sitemap-stat-value">{summary?.counts?.category || 0}</span>
                <span className="sitemap-stat-label">Category Pages</span>
              </div>
            </div>

            <div className="sitemap-stat-card">
              <div className="sitemap-stat-icon-box product">
                <Shirt size={22} />
              </div>
              <div className="sitemap-stat-info">
                <span className="sitemap-stat-value">{summary?.counts?.product || 0}</span>
                <span className="sitemap-stat-label">Product Pages</span>
              </div>
            </div>
          </div>

          {/* Quick Actions, Upload Controls & Live Links Cards */}
          <div className="sitemap-management-grid">
            {/* Sitemap.xml Management Card */}
            <div className="sitemap-control-card">
              <div className="control-card-header">
                <div className="control-title-wrap">
                  <div className="control-icon-box xml">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h3 className="control-title">XML Sitemap (sitemap.xml)</h3>
                    <p className="control-sub">
                      Published XML index for Googlebot & Bingbot crawlers
                    </p>
                  </div>
                </div>
                <span className="control-status-tag live">Live & Indexed</span>
              </div>

              <div className="control-card-actions">
                <a
                  href={summary?.sitemapUrl || "http://localhost:5000/api/seo/sitemap.xml"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-control-action view"
                >
                  <ExternalLink size={14} />
                  <span>View XML Sitemap</span>
                </a>

                {/* Upload Custom sitemap.xml */}
                <input
                  type="file"
                  ref={sitemapFileInputRef}
                  style={{ display: "none" }}
                  accept=".xml,text/xml"
                  onChange={handleSitemapFileUpload}
                />
                <button
                  type="button"
                  className="btn-control-action upload"
                  onClick={() => sitemapFileInputRef.current?.click()}
                  disabled={isUploadingSitemap}
                >
                  <UploadCloud size={14} />
                  <span>{isUploadingSitemap ? "Uploading..." : "Upload Custom sitemap.xml"}</span>
                </button>

                <button
                  type="button"
                  className="btn-control-action sync"
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="Auto-generate from catalog"
                >
                  <RefreshCw size={14} className={isSyncing ? "spin-icon" : ""} />
                  <span>{isSyncing ? "Syncing..." : "Auto-Generate / Sync"}</span>
                </button>
              </div>
            </div>

            {/* Robots.txt Management Card */}
            <div className="sitemap-control-card">
              <div className="control-card-header">
                <div className="control-title-wrap">
                  <div className="control-icon-box robots">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="control-title">Robots Configuration (robots.txt)</h3>
                    <p className="control-sub">
                      Search engine crawler permissions & route safeguards
                    </p>
                  </div>
                </div>
                <span className="control-status-tag active">Crawling Enabled</span>
              </div>

              <div className="control-card-actions">
                <a
                  href={summary?.robotsUrl || "http://localhost:5000/api/seo/robots.txt"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-control-action view"
                >
                  <ExternalLink size={14} />
                  <span>View robots.txt</span>
                </a>

                {/* Upload Custom robots.txt */}
                <input
                  type="file"
                  ref={robotsFileInputRef}
                  style={{ display: "none" }}
                  accept=".txt,text/plain"
                  onChange={handleRobotsFileUpload}
                />
                <button
                  type="button"
                  className="btn-control-action upload"
                  onClick={() => robotsFileInputRef.current?.click()}
                  disabled={isUploadingRobots}
                >
                  <UploadCloud size={14} />
                  <span>{isUploadingRobots ? "Uploading..." : "Upload Custom robots.txt"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Card: Sitemap URLs Directory */}
          <div className="sitemap-main-card">
            <div className="sitemap-card-header">
              <div className="sitemap-card-title-wrap">
                <Network size={18} className="sitemap-header-blue-icon" />
                <h2 className="sitemap-card-title">Registered Sitemap Entries</h2>
              </div>

              {/* Filter pills */}
              <div className="sitemap-type-pills">
                <button
                  type="button"
                  className={`sitemap-pill ${typeFilter === "all" ? "active" : ""}`}
                  onClick={() => setTypeFilter("all")}
                >
                  All ({entries.length})
                </button>
                <button
                  type="button"
                  className={`sitemap-pill ${typeFilter === "system" ? "active" : ""}`}
                  onClick={() => setTypeFilter("system")}
                >
                  System ({summary?.counts?.system || 0})
                </button>
                <button
                  type="button"
                  className={`sitemap-pill ${typeFilter === "category" ? "active" : ""}`}
                  onClick={() => setTypeFilter("category")}
                >
                  Categories ({summary?.counts?.category || 0})
                </button>
                <button
                  type="button"
                  className={`sitemap-pill ${typeFilter === "product" ? "active" : ""}`}
                  onClick={() => setTypeFilter("product")}
                >
                  Products ({summary?.counts?.product || 0})
                </button>
              </div>

              {/* Search */}
              <div className="sitemap-search-wrap">
                <Search size={15} className="sitemap-search-icon" />
                <input
                  type="text"
                  className="sitemap-search-input"
                  placeholder="Filter URL or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="sitemap-table-responsive">
              <table className="sitemap-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Page / Destination</th>
                    <th style={{ width: "12%" }}>Type</th>
                    <th style={{ width: "30%" }}>Target URL (Canonical)</th>
                    <th style={{ width: "10%" }}>Changefreq</th>
                    <th style={{ width: "8%" }}>Priority</th>
                    <th style={{ width: "10%" }}>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "36px 20px", color: "#64748b" }}>
                        No sitemap entries found matching your search or filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((item, idx) => (
                      <tr key={item.path || `${item.type}-${idx}`}>
                        <td>
                          <span className="sitemap-entry-name">{item.name || item.path}</span>
                        </td>

                        <td>
                          <span className={`sitemap-type-tag type-${item.type}`}>
                            {item.type}
                          </span>
                        </td>

                        <td>
                          <div className="sitemap-loc-cell">
                            <code className="sitemap-loc-code">{item.loc}</code>
                            <a
                              href={item.loc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sitemap-loc-link"
                              title="Open URL"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </td>

                        <td>
                          <span className="sitemap-freq-badge">{item.changefreq}</span>
                        </td>

                        <td>
                          <span
                            className={`sitemap-prio-badge ${
                              Number(item.priority) >= 0.9
                                ? "prio-high"
                                : Number(item.priority) >= 0.7
                                ? "prio-med"
                                : "prio-low"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>

                        <td>
                          <span className="sitemap-date-text">{item.lastmod}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={totalItems}
              pageSize={pageSize}
              onChange={setCurrentPage}
            />
          </div>

          {/* Crawler Safeguard & Robots.txt Status Card */}
          <div className="sitemap-robots-card">
            <div className="sitemap-robots-header">
              <div className="robots-title-wrap">
                <ShieldCheck size={18} className="robots-shield-icon" />
                <h3>Search Engine Crawling & Robots Safeguard</h3>
              </div>
              <span className="robots-status-pill active">
                <CheckCircle2 size={13} />
                Indexing Enabled
              </span>
            </div>
            <p className="robots-explainer">
              The search crawler rules below protect private user data (cart, checkout, customer accounts, and admin portal) while ensuring Googlebot and Bingbot can crawl all public product and category catalog URLs.
            </p>
            <div className="robots-rules-preview">
              <code>
                User-agent: *<br />
                Allow: /<br />
                Disallow: /admin<br />
                Disallow: /cart<br />
                Disallow: /checkout<br />
                Disallow: /account<br />
                Disallow: /profile<br />
                Disallow: /my-orders<br />
                Disallow: /login<br />
                Disallow: /register<br />
                Sitemap: {summary?.baseUrl || "https://zmwclothing.com"}/sitemap.xml
              </code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
