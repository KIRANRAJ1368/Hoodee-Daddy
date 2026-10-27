import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ComingSoon.css";

const POPULAR_CATEGORIES = [
  { label: "New Arrivals", href: "/collection?collection=new-arrivals" },
  { label: "Kids Hoodies", href: "/collection?category=kids-hoodies" },
  { label: "Kids Pyjamas", href: "/collection?category=kids-pyjamas" },
  { label: "Kids Co-Ords", href: "/collection?category=kids-co-ords" },
  { label: "Boys Fashion", href: "/collection?category=boys-fashion" },
  { label: "Girls Fashion", href: "/collection?category=girls-fashion" }
];

export default function ComingSoon({ title = "Page Not Found" }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const is404 = String(title || "").toLowerCase().includes("not found") || String(title || "").toLowerCase().includes("404");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/collection?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <section className="coming-soon-section">
      <div className="container coming-soon-inner">
        <div className="coming-soon-badge-wrap">
          <span className="coming-soon-pill">
            {is404 ? "ERROR 404" : "FRESH DROP COMING"}
          </span>
        </div>

        <div className="coming-soon-graphic" aria-hidden="true">
          {is404 ? "🛍️" : "✨"}
        </div>

        <h1 className="coming-soon-title">
          {is404 ? "Oops! We Can't Find That Page" : title}
        </h1>

        <p className="coming-soon-copy">
          {is404
            ? "The page or product you're looking for might have been moved, renamed, or is currently taking a nap. Try searching below or explore our freshest drops!"
            : "We're putting the finishing stitches on this collection. In the meantime, explore our available hoodies and everyday kids streetwear!"}
        </p>

        {/* Quick Search */}
        <form className="coming-soon-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search hoodies, pyjamas, co-ords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="coming-soon-search-input"
          />
          <button type="submit" className="coming-soon-search-btn">
            Search
          </button>
        </form>

        {/* Quick Category Chips */}
        <div className="coming-soon-chips-wrap">
          <span className="coming-soon-chips-title">POPULAR DESTINATIONS:</span>
          <div className="coming-soon-chips">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link key={cat.label} to={cat.href} className="coming-soon-chip">
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="coming-soon-actions">
          <Link to="/collection" className="btn btn-primary">
            Explore All Collections →
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
