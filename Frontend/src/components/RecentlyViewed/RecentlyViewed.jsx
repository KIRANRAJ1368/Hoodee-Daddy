import { useShop } from "../../context/ShopContext";
import ProductCard from "../ProductCard/ProductCard";
import "./RecentlyViewed.css";

export default function RecentlyViewed() {
  const { recentlyViewed } = useShop();

  const displayItems = recentlyViewed.slice(0, 4);

  if (displayItems.length === 0) return null;

  return (
    <section className="recently-viewed-section" aria-labelledby="recently-viewed-title">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">YOUR ZMW EDIT</span>
          <h2 id="recently-viewed-title" className="section-title">Recently Viewed Products</h2>
          <p className="section-subtitle">
            Pick up where you left off with pieces you have explored recently.
          </p>
        </div>
        <div className="recently-viewed-grid">
          {displayItems.map((product) => (
            <ProductCard key={`recent-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
