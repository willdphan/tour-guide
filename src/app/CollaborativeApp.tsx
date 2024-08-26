"use client";

import { useOthers, useRoom, useSelf, useUpdateMyPresence } from "@liveblocks/react";
import { useState, useEffect } from "react";

const Cursor = ({ x, y, color }) => {
  return (
    <svg
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transition: 'all 0.1s ease',
        pointerEvents: 'none',
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
        stroke="white"
      />
    </svg>
  );
};

export function CollaborativeApp({ children }) {
  const others = useOthers();
  const userCount = others.length;
  const room = useRoom();
  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();
  
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const [showHighlight, setShowHighlight] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  useEffect(() => {
    console.log('Setting up EventSource');
    const eventSource = new EventSource('/api/run_agent?question=find%20title');

    eventSource.onmessage = (event) => {
      console.log('Received event:', event);
      if (event.data === "[DONE]") {
        console.log("Stream ended");
        eventSource.close();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);
        setCurrentStep(data);

        if (data.screen_location) {
          const newPosition = {
            x: data.screen_location.x,
            y: data.screen_location.y,
          };
          console.log("Updating cursor position:", newPosition);
          setHighlightPosition(newPosition);
          setShowHighlight(true);

          // Update Liveblocks presence
          updateMyPresence({ cursor: newPosition });
          console.log("Updated presence:", newPosition);
        }

        if (data.action === "ANSWER;") {
          setShowHighlight(false);
          console.log("Task completed:", data.instruction);
        }
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    return () => {
      console.log('Closing EventSource');
      eventSource.close();
    };
  }, [updateMyPresence]);

  console.log("Self presence:", self?.presence);
  console.log("Others:", others);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      <div style={{ position: 'absolute', top: 10, left: 10 }}>There are {userCount} other user(s) online</div>
      {showHighlight && (
        <div
          style={{
            position: 'absolute',
            left: highlightPosition.x,
            top: highlightPosition.y,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 0, 0, 0.5)',
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      )}
      {currentStep && (
        <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'white', padding: 10, border: '1px solid black' }}>
          <p>Action: {currentStep.action}</p>
          <p>Instruction: {currentStep.instruction}</p>
        </div>
      )}
      {self && self.presence && self.presence.cursor && (
        <Cursor
          x={self.presence.cursor.x}
          y={self.presence.cursor.y}
          color="blue"
        />
      )}
      {others.map(({ connectionId, presence }) => {
        if (presence.cursor) {
          return (
            <Cursor
              key={`cursor-${connectionId}`}
              x={presence.cursor.x}
              y={presence.cursor.y}
              color="green"
            />
          );
        }
        return null;
      })}
      {children}
    </div>
  );
}