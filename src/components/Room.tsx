"use client";
import { useCallback,useEffect, useState, useRef } from 'react';
import { ReactNode } from "react";

import SpotLightSearch from '@/components/SpotLightSearch';
import { LiveObject } from "@liveblocks/client";
import { useMyPresence, useOthers, useSelf, useUpdateMyPresence } from "@liveblocks/react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import AgentActionConfirmation from './AgentActionConfirmation';

function Cursor({ x, y, color, isActive }: { x: number; y: number; color: string; isActive: boolean }) {
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

function RoomContent({ children }: { children: ReactNode }) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const updateMyPresenceFn = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();
  const myId = self?.id;

  const [agentCursor, setAgentCursor] = useState<{ x: number; y: number } | null>(null);
  const [initialCursorPosition, setInitialCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [currentAction, setCurrentAction] = useState<any | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [agentCursorColor, setAgentCursorColor] = useState("#0000FF"); // Blue

  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Set initial cursor position to bottom right
  useEffect(() => {
    const updateInitialPosition = () => {
      const { innerWidth, innerHeight } = window;
      setInitialCursorPosition({ x: innerWidth + 100 , y: innerHeight + 100}); // where cursor starts
    };

    updateInitialPosition();
    window.addEventListener('resize', updateInitialPosition);

    return () => window.removeEventListener('resize', updateInitialPosition);
  }, []);

  useEffect(() => {
    console.log("Agent cursor color set to:", agentCursorColor);
  }, [agentCursorColor]);

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
    setCurrentAction(action);
    setIsAgentActive(true);

    const moveMouseTo = (x: number, y: number) => {
      if (x !== undefined && y !== undefined) {
        setAgentCursor({ x, y });
        updateMyPresenceFn({
          cursor: { x, y },
          isAgent: true,
        });
        console.log(`Moved cursor to (${x}, ${y})`);
      }
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

    return new Promise<void>(async (resolve) => {
      await performAction();
      await wait(1000); // Add a delay after each action
      setIsAgentActive(false);
      resolve();
    });

    async function performAction() {
      switch (action.action) {
        case 'Click':
          if (action.element_description) {
            const element = findElementByText(action.element_description);
            if (element instanceof HTMLElement) {
              const rect = element.getBoundingClientRect();
              moveMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
              await wait(1000);
              scrollToElement(element);
              await wait(1000);
              element.click();
              console.log('Clicked element:', element);
              // Visual feedback
              element.style.border = '2px solid blue';
              setTimeout(() => element.style.border = '', 1000);
            }
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
          console.log('Waiting for 0 seconds');
          await wait(0);
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
          break;

        default:
          console.log('Unknown action:', action.action, action.instruction);
      }
    }
  }, [setAgentCursor, updateMyPresenceFn]);

  const handleSearch = useCallback((selectedItem: { title: string, description: string }) => {
    setUserQuery(selectedItem.title);
  }, []);

  const updateCursorColors = useCallback((newAgentColor: string) => {
    setAgentCursorColor(newAgentColor);
  }, []);

  const handleActionConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      console.log('Action confirmed:', currentAction);
      // Perform the action here
    } else {
      console.log('Action cancelled:', currentAction);
      setIsAgentActive(false);
    }
    setCurrentAction(null);
    setShowConfirmation(false);
  };

  // Use an effect to ensure cursor visibility
  useEffect(() => {
    if (showConfirmation && !agentCursor) {
      console.warn('Cursor position lost while confirmation box is visible');
    }
  }, [showConfirmation, agentCursor]);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-grow relative overflow-hidden">
        {initialCursorPosition && (
          <Cursor 
            x={agentCursor ? agentCursor.x : initialCursorPosition.x} 
            y={agentCursor ? agentCursor.y : initialCursorPosition.y} 
            color={agentCursorColor} 
            isActive={isAgentActive}
          />
        )}
        <div
          className="absolute top-4 left-4 z-50 flex gap-4"
        >
          <SpotLightSearch 
            onSelect={handleSearch}
            updateMyPresenceFn={updateMyPresenceFn}
            simulateAgentAction={simulateAgentAction}
          />
        </div>
        {showConfirmation && currentAction && (
          <AgentActionConfirmation
            action={currentAction}
            onConfirm={handleActionConfirmation}
            isAgentRunning={isAgentRunning}
          />
        )}
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
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