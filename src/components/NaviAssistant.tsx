"use client";

// HIGHER-LEVEL COMPONENT, SPOTLIGHT SEARCH, CURSOR POSITIONING, 
// SIMULATE AGENT ACTION OVER APP - ALL PUT TOGETHER

import { useCallback,useEffect, useState } from 'react';
import { ReactNode } from "react";
import SpotLightSearch from '@/components/SpotLightSearch';
import Popup from './Popup';
import Cursor from './Cursor';
import { simulateAgent } from '@/utils/actionExecuter';

// SPOTLIGHT AND NAVI POPUP
function NaviInterface({ children }: { children: ReactNode }) {
  const [agentCursor, setAgentCursor] = useState<{ x: number; y: number } | null>(null);
  const [initialCursorPosition, setInitialCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [currentAction, setCurrentAction] = useState<any | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // SIMULATE AGENT ACTIONS
  // simulate agent actions from actionExecuter.tsx
  const simulateAgentAction = useCallback((action: any) => {
    const agentFunction = simulateAgent({
      setCurrentAction,
      setIsAgentActive,
      setAgentCursor,
    });
    agentFunction(action);
  }, [setCurrentAction, setIsAgentActive, setAgentCursor]);

  // SPOTLIGHT SEARCH HANDLER
  // handler for spotlight search selection on SpotLightSearch.tsx
  const handleSpotlightSelect = useCallback((selectedItem: { title: string, description: string }) => {
    setUserQuery(selectedItem.title);
    simulateAgentAction({
      action: 'SEARCH',
      instruction: selectedItem.title,
      description: selectedItem.description
    });
    setShowConfirmation(true);
  }, [simulateAgentAction]);

  // CURSOR STARTING POSITION
  // set initial cursor position to bottom right
  useEffect(() => {
    const updateInitialPosition = () => {
      // built in js
      const {innerWidth, innerHeight} = window
      // set cursor starting position
      setInitialCursorPosition({ x: innerWidth + 100 , y: innerHeight + 100});
    };
    // call func to update pos
    updateInitialPosition();

    // handles screen resizing when user changes window size
    // listening to 'resize' and calls updateInitialPosition when it occurs
    window.addEventListener('resize', updateInitialPosition);

    // cleanup funciton to clear state, calls again to reset
    return () => window.removeEventListener('resize', updateInitialPosition);
  }, []); // run on mount

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-grow relative overflow-hidden">
        {initialCursorPosition && (
          <Cursor 
            x={agentCursor ? agentCursor.x : initialCursorPosition.x}
            y={agentCursor ? agentCursor.y : initialCursorPosition.y}
            isActive={isAgentActive}  />
        )}
        <div
          className="absolute top-4 left-4 z-50 flex gap-4"
        >
          <SpotLightSearch 
            onSelect={handleSpotlightSelect}
            simulateAgentAction={simulateAgentAction}
            updateMyPresenceFn={(presence) => {
              // Implement this function if needed
              console.log('Update presence:', presence);
            }}
          />
        </div>
        {showConfirmation && currentAction && (
          <Popup
            action={currentAction}
            isWaiting={false}
            onClose={() => setShowConfirmation(false)}
          />
        )}
        <div className="h-full overflow-auto bg-[#FDF9ED]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function NaviWrapper({ children }: { children: ReactNode }) {
  return <NaviInterface>{children}</NaviInterface>;
}
