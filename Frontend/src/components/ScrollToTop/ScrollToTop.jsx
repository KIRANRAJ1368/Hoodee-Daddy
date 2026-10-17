import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 *
 * New routes always start at the top. Same-page hash navigation keeps its
 * existing anchor behavior.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const previousRoute = useRef({ pathname, search });

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    const prevParams = new URLSearchParams(previousRoute.current.search);
    const currParams = new URLSearchParams(search);

    const pathChanged = previousRoute.current.pathname !== pathname;
    const categoryChanged = prevParams.get("category") !== currParams.get("category");
    const collectionChanged = prevParams.get("collection") !== currParams.get("collection");

    // Only scroll to top on actual page navigation or top-level category/collection link switch,
    // NEVER on in-page filter changes (color, size, price, availability, sorting) or when an anchor hash is targeted.
    const shouldScrollToTop = (pathChanged || categoryChanged || collectionChanged) && !hash;

    if (shouldScrollToTop) {
      window.scrollTo(0, 0);
    } else if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        const navEl = document.querySelector(".site-header");
        const navHeight = navEl ? navEl.offsetHeight : 76;
        const targetY = Math.max(0, element.getBoundingClientRect().top + window.pageYOffset - navHeight - 12);
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    }

    previousRoute.current = { pathname, search };
  }, [pathname, search, hash]);

  return null;
}
