"use client";

import { useState, useEffect } from 'react';
import { useMyPresence, useOthers } from "@liveblocks/react";

function Cursor({ x, y, color }: { x: number; y: number; color: string }) {
    return (
      <svg
        style={{
          position: "absolute",
          left: x,
          top: y,
          transition: "all 1s ease",
          transform: "translateX(-50%) translateY(-50%)",
          pointerEvents: "none",
          zIndex: 1000,
        }}
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
        />
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          stroke="white"
        />
      </svg>
    );
  }

export function LiveCursor() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateMyPresence({
        cursor: { x: event.clientX, y: event.clientY },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateMyPresence]);

  return (
    <>
      {myPresence.cursor && (
        <Cursor x={myPresence.cursor.x} y={myPresence.cursor.y} color="#0000FF" />
      )}
      {others.map(({ connectionId, presence }) => 
        presence.cursor && (
          <Cursor 
            key={connectionId} 
            x={presence.cursor.x} 
            y={presence.cursor.y} 
            color="#FF0000" 
          />
        )
      )}
    </>
  );
}