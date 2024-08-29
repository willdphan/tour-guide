"use client";
import { useCallback,useEffect, useState } from 'react';
import { ReactNode } from "react";

import SpotLightSearch from '@/components/SpotLightSearch';
import { LiveObject } from "@liveblocks/client";
import { useMyPresence, useOthers, useSelf, useUpdateMyPresence } from "@liveblocks/react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

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

function RoomContent({ children }: { children: ReactNode }) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const updateMyPresenceFn = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();
  const myId = self?.id;

  const [agentCursor, setAgentCursor] = useState({ x: 0, y: 0 });
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userCursorColor, setUserCursorColor] = useState("#FF0000");
  const [agentCursorColor, setAgentCursorColor] = useState("#00FF00");

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateMyPresence({
        cursor: { x: event.clientX, y: event.clientY },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateMyPresence]);

  const simulateAgentAction = useCallback((action: any) => {
    console.log('Simulating action:', action);

    const moveMouseTo = (x: number, y: number) => {
      // Update the cursor position
      setAgentCursor({ x, y });
      updateMyPresenceFn({
        cursor: { x, y },
        isAgent: true,
      });
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    switch (action.action) {
      case 'Click':
        if (action.screen_location) {
          moveMouseTo(action.screen_location.x, action.screen_location.y);
          wait(2000).then(() => {
            const element = document.elementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element) {
              (element as HTMLElement).click();
            }
          });
        }
        break;

      case 'Type':
        if (action.screen_location && action.text_input) {
          moveMouseTo(action.screen_location.x, action.screen_location.y);
          wait(2000).then(() => {
            const element = document.elementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element instanceof HTMLInputElement) {
              element.value = action.text_input;
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        }
        break;

      case 'Scroll':
        if (action.screen_location) {
          moveMouseTo(action.screen_location.x, action.screen_location.y);
          wait(2000).then(() => {
            const instruction = action.instruction.toLowerCase();
            let scrollX = 0;
            let scrollY = 0;

            if (instruction.includes('up')) {
              scrollY = -100;
            } else if (instruction.includes('down')) {
              scrollY = 100;
            } else if (instruction.includes('left')) {
              scrollX = -100;
            } else if (instruction.includes('right')) {
              scrollX = 100;
            }

            // Find the scrollable container
            const scrollableContainer = document.querySelector('.overflow-x-auto');
            if (scrollableContainer) {
              scrollableContainer.scrollBy(scrollX, scrollY);
            } else {
              window.scrollBy(scrollX, scrollY);
            }
          });
        }
        break;

      case 'Wait':
        // Just wait for 5 seconds
        wait(5000);
        break;

      case 'GoBack':
        window.history.back();
        break;

      case 'Home':
        console.log('Navigating to home page');
        window.location.href = 'http://localhost:3000/';
        break;

      case 'ANSWER':
        console.log('Task completed. Answer:', action.instruction);
        // You might want to display this answer somewhere in your UI
        break;

      default:
        console.log('Unknown action:', action.action, action.instruction);
    }
  }, [setAgentCursor, updateMyPresenceFn]);

  const handleSearch = useCallback((selectedItem: { title: string, description: string }) => {
    setUserQuery(selectedItem.title);
  }, []);

  const updateCursorColors = useCallback((newUserColor: string, newAgentColor: string) => {
    setUserCursorColor(newUserColor);
    setAgentCursorColor(newAgentColor);
  }, []);

  useEffect(() => {
    // Change colors after a short delay to ensure it's not overwritten
    const timer = setTimeout(() => {
      setUserCursorColor("#0000FF"); // Change to blue
      setAgentCursorColor("#FFA500"); // Change to orange
      console.log("Cursor colors updated:", userCursorColor, agentCursorColor);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {others.map(({ connectionId, presence }) => 
        presence.cursor && connectionId !== myId && (
          <Cursor 
            key={connectionId} 
            x={presence.cursor.x} 
            y={presence.cursor.y} 
            color={presence.isAgent ? agentCursorColor : userCursorColor} 
          />
        )
      )}
      <Cursor 
        x={agentCursor.x} 
        y={agentCursor.y} 
        color={agentCursorColor} 
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
        }}
      >
        <SpotLightSearch 
          onSelect={handleSearch}
          updateMyPresenceFn={updateMyPresenceFn}
          simulateAgentAction={simulateAgentAction}
        />
      </div>
      {children}
    </div>
  );
}

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={"pk_dev_JHXXlhVbiyY12zGe6mVyVYyAZKm7leqR36yvH_1rY_0Cxxk25HAFapwtmrkUzZz8"}>
      <RoomProvider id="tour" initialStorage={{
        // ✅ This is a client component, so everything works!
        session: new LiveObject(),
      }} initialPresence={{
        cursorType: '',
        cursor: null,
        isAgent: false
      }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => <RoomContent>{children}</RoomContent>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}