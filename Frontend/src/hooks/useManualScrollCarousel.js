import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Hook for smooth, manual-scrollable carousels.
 * Supports:
 * - Native touch swipe (mobile & tablet) with hardware acceleration & scroll-snap
 * - Mouse drag-to-scroll (desktop) with click-suppression on drag
 * - Native horizontal trackpad / shift+wheel scrolling
 * - Floating side arrow buttons (prev / next) with wrap-around
 * - Optional gentle autoplay with pause on hover / touch / drag
 */
export default function useManualScrollCarousel({ autoDelayMs = 0 } = {}) {
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const timerRef = useRef(null);

  const getStepWidth = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 300;
    const slide = el.querySelector(".carousel-slide-item, .cat-feature-carousel-slide") || el.firstElementChild;
    return slide ? slide.getBoundingClientRect().width : el.clientWidth / 2;
  }, []);

  const scrollNext = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = getStepWidth();
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 15) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollLeft = 0;
      }
    } else {
      if (typeof el.scrollBy === "function") {
        el.scrollBy({ left: step, behavior: "smooth" });
      } else {
        el.scrollLeft = (el.scrollLeft || 0) + step;
      }
    }
  }, [getStepWidth]);

  const scrollPrev = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = getStepWidth();
    if (el.scrollLeft <= 15) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else {
        el.scrollLeft = el.scrollWidth || 0;
      }
    } else {
      if (typeof el.scrollBy === "function") {
        el.scrollBy({ left: -step, behavior: "smooth" });
      } else {
        el.scrollLeft = Math.max(0, (el.scrollLeft || 0) - step);
      }
    }
  }, [getStepWidth]);

  // Autoplay
  useEffect(() => {
    if (autoDelayMs <= 0 || isPaused) return;
    timerRef.current = setInterval(() => {
      if (!isDraggingRef.current) {
        scrollNext();
      }
    }, autoDelayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoDelayMs, isPaused, scrollNext]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only main left mouse button
    const el = trackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = el.scrollLeft;
    el.style.scrollBehavior = "auto";
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - deltaX;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = trackRef.current;
    if (el) {
      el.style.scrollBehavior = "smooth";
      el.style.scrollSnapType = "x mandatory";
      el.style.cursor = "";
    }
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 60);
  };

  const handleClickCapture = (e) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    trackRef,
    scrollNext,
    scrollPrev,
    setIsPaused,
    containerProps: {
      onMouseEnter: () => setIsPaused(true),
      onMouseLeave: () => {
        setIsPaused(false);
        handleMouseUp();
      },
      onTouchStart: () => setIsPaused(true),
      onTouchEnd: () => setIsPaused(false)
    },
    trackProps: {
      ref: trackRef,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onClickCapture: handleClickCapture,
      onDragStart: (e) => e.preventDefault()
    }
  };
}
