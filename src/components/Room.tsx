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

  const simulateAgentAction = useCallback(async (action: any) => {
    console.log('Simulating action:', action);

    const moveMouseTo = (x: number, y: number) => {
      setAgentCursor({ x, y });
      updateMyPresenceFn({
        cursor: { x, y },
        isAgent: true,
      });
      console.log(`Moved cursor to (${x}, ${y})`);
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const scrollToElement = (element: Element) => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      console.log('Scrolled to element:', element);
    };

    const getElementFromPoint = (x: number, y: number) => {
      return document.elementFromPoint(x, y);
    };

    const findElementByText = (text: string) => {
      return Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.trim() === text);
    };

    const performAction = async () => {
      switch (action.action) {
        case 'Click':
          if (action.element_description) {
            const element = findElementByText(action.element_description);
            if (element instanceof HTMLElement) {
              scrollToElement(element);
              await wait(1000);
              element.click();
              console.log('Clicked element:', element);
              // Visual feedback
              element.style.border = '2px solid red';
              setTimeout(() => element.style.border = '', 1000);
            } else if (action.screen_location) {
              moveMouseTo(action.screen_location.x, action.screen_location.y);
              await wait(1000);
              const elementAtPoint = getElementFromPoint(action.screen_location.x, action.screen_location.y);
              if (elementAtPoint instanceof HTMLElement) {
                scrollToElement(elementAtPoint);
                await wait(1000);
                elementAtPoint.click();
                console.log('Clicked element at point:', elementAtPoint);
                // Visual feedback
                elementAtPoint.style.border = '2px solid red';
                setTimeout(() => elementAtPoint.style.border = '', 1000);
              } else {
                console.log('No clickable element found at the specified location or with the given description');
              }
            }
          }
          break;

        case 'Type':
          if (action.screen_location && action.text_input) {
            moveMouseTo(action.screen_location.x, action.screen_location.y);
            await wait(1000);
            const element = getElementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element instanceof HTMLInputElement) {
              scrollToElement(element);
              await wait(1000);
              element.value = action.text_input;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('Typed into input:', action.text_input);
              // Visual feedback
              element.style.backgroundColor = 'yellow';
              setTimeout(() => element.style.backgroundColor = '', 1000);
            } else {
              console.log('No input element found at the specified location');
            }
          }
          break;

        case 'Scroll':
          if (action.screen_location) {
            moveMouseTo(action.screen_location.x, action.screen_location.y);
            await wait(1000);
            const element = getElementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element) {
              scrollToElement(element);
            } else {
              console.log('No element found at the specified location for scrolling');
            }
          }
          break;

        case 'Wait':
          console.log('Waiting for 5 seconds');
          await wait(5000);
          break;

        case 'GoBack':
          console.log('Navigating back');
          window.history.back();
          break;

        case 'Home':
          console.log('Navigating to home page');
          window.location.href = '/';
          break;

        case 'FINAL_ANSWER':
          console.log('Task completed. Answer:', action.instruction);
          // Display the answer in the UI
          const answerElement = document.createElement('div');
          answerElement.textContent = `Agent's Answer: ${action.instruction}`;
          answerElement.style.position = 'fixed';
          answerElement.style.bottom = '20px';
          answerElement.style.left = '20px';
          answerElement.style.backgroundColor = 'lightgreen';
          answerElement.style.padding = '10px';
          answerElement.style.borderRadius = '5px';
          document.body.appendChild(answerElement);
          setTimeout(() => document.body.removeChild(answerElement), 5000);
          break;

        default:
          console.log('Unknown action:', action.action, action.instruction);
      }
    };

    await performAction();
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