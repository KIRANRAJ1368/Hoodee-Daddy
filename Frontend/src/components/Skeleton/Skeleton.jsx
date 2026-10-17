import React from "react";

export default function Skeleton({
  width,
  height,
  circle = false,
  className = "",
  style = {}
}) {
  const customStyle = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(circle ? { borderRadius: "50%" } : {}),
    ...style
  };

  return <div className={`sk ${className}`.trim()} style={customStyle} />;
}

Skeleton.Item = function SkeletonItem({ className = "", style = {} }) {
  return (
    <div className={`item ${className}`.trim()} style={style}>
      <div className="av sk" />
      <div style={{ flex: 1 }}>
        <div className="t sk w1" />
        <div className="t sk w2" />
      </div>
    </div>
  );
};

Skeleton.List = function SkeletonList({ count = 4, className = "" }) {
  return (
    <div className={`skeleton-list ${className}`.trim()} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton.Item key={i} />
      ))}
    </div>
  );
};
