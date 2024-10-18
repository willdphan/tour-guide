// AGENT CURSOR

import React from "react";

interface CursorProps {
  x: number;
  y: number;
  isActive: boolean;
}

export default function Cursor({ x, y, isActive }: CursorProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transition: "all 0.5s ease",
        transform: "translateX(-50%) translateY(-50%)",
        pointerEvents: "none",
        zIndex: 1000,
        opacity: isActive ? 1 : 0.0, // Fade out when inactive
      }}
    >
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill="#365E59"
        />
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          stroke="white"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "100%",
          backgroundColor: "#365E59",
          color: "white",
          padding: "2px 4px",
          borderRadius: "4px",
          fontSize: "12px",
          whiteSpace: "nowrap",
          marginTop: "-12px",
          marginLeft: "-5px",
          transform: "translateX(-10%)",
        }}
      >
        Tour Guide
      </div>
    </div>
  );
}
