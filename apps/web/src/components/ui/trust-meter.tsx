import React from "react";

export function TrustMeter({
  level,
  dark = false,
  width,
  height = 6,
}: {
  level: number;
  dark?: boolean;
  width?: number | string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(6, level));
  const filledColor = dark ? "#D5F75A" : "#11141A";
  const emptyColor = dark ? "#3A4150" : "#E8E2D3";

  return (
    <span
      className="grid grid-cols-6 gap-1"
      style={{ width: width ?? "100%" }}
      aria-label={`Verification level ${clamped} of 6`}
    >
      {[1, 2, 3, 4, 5, 6].map((seg) => (
        <i
          key={seg}
          style={{
            height: `${height}px`,
            borderRadius: "999px",
            background: seg <= clamped ? filledColor : emptyColor,
            display: "block",
          }}
        />
      ))}
    </span>
  );
}
