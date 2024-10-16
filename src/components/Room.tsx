"use client";
import { useCallback,useEffect, useState } from 'react';
import { ReactNode } from "react";
import SpotLightSearch from '@/components/SpotLightSearch';
import AgentActionConfirmation from './AgentActionConfirmation';
import Cursor from './Cursor';

function RoomContent({ children }: { children: ReactNode }) {
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

  const simulateAgentAction = useCallback(async (action: any) => {
    console.log('Simulating action:', action);
    setCurrentAction(action);
    setIsAgentActive(true);

    const moveMouseTo = (x: number, y: number) => {
      if (x !== undefined && y !== undefined) {
        setAgentCursor({ x, y });
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
              element.style.border = '2px solid #365E59';
              setTimeout(() => element.style.border = '', 2000);
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
  }, []);

  const handleSearch = useCallback((selectedItem: { title: string, description: string }) => {
    setUserQuery(selectedItem.title);
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
            simulateAgentAction={simulateAgentAction}
          />
        </div>
        {showConfirmation && currentAction && (
          <AgentActionConfirmation
            action={currentAction}
            onConfirm={handleActionConfirmation}
            isAgentRunning={isAgentRunning} isWaiting={false} initialResponse={''}          />
        )}
        <div className="h-full overflow-auto bg-[#FDF9ED]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Room({ children }: { children: ReactNode }) {
  return <RoomContent>{children}</RoomContent>;
}
