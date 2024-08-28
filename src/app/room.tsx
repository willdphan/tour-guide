"use client";
import { useState, useEffect, useCallback } from 'react';
import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useMyPresence, useOthers, useSelf, useUpdateMyPresence } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";

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

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateMyPresence({
        cursor: { x: event.clientX, y: event.clientY },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateMyPresence]);

  const runAgent = useCallback(async () => {
    if (isAgentRunning || !userQuery.trim()) return;
    setIsAgentRunning(true);

    try {
      const currentUrl = window.location.href;
      console.log(`Current URL: ${currentUrl}`); // Debug log

      const response = await fetch(`/api/run-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          question: userQuery,
          currentUrl: currentUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6); // Remove 'data: ' prefix
            if (jsonData === '[DONE]') {
              console.log('Stream completed');
              break;
            }
            try {
              const parsedData = JSON.parse(jsonData);
              console.log('Received data:', parsedData);
              
              if (parsedData.screen_location) {
                const { x, y } = parsedData.screen_location;
                console.log(`Updating agent cursor position to: (${x}, ${y})`);
                setAgentCursor({ x, y });
                
                updateMyPresenceFn({
                  cursor: { x, y },
                  isAgent: true,
                });

                // Simulate the agent's action
                simulateAgentAction(parsedData);
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsAgentRunning(false);
    }
  }, [updateMyPresenceFn, isAgentRunning, userQuery]);

  const simulateAgentAction = useCallback((action: any) => {
    if (action.action === 'Click') {
      const element = document.elementFromPoint(action.screen_location.x, action.screen_location.y);
      if (element) {
        (element as HTMLElement).click();
      }
    } else if (action.action === 'Type') {
      const element = document.elementFromPoint(action.screen_location.x, action.screen_location.y);
      if (element instanceof HTMLInputElement) {
        element.value = action.text_input;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (action.action === 'Scroll') {
      window.scrollTo({
        top: action.screen_location.y,
        behavior: 'smooth'
      });
    } else if (action.action === 'Back') {
      window.history.back();
    }
    // Add more action types as needed
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {others.map(({ connectionId, presence }) => 
        presence.cursor && connectionId !== myId && (
          <Cursor 
            key={connectionId} 
            x={presence.cursor.x} 
            y={presence.cursor.y} 
            color={presence.isAgent ? "#00FF00" : "#FF0000"} 
          />
        )
      )}
      <Cursor 
        x={agentCursor.x} 
        y={agentCursor.y} 
        color="#00FF00" 
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
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Enter your query"
          style={{
            padding: '5px',
            width: '200px',
          }}
        />
        <button 
          onClick={runAgent} 
          disabled={isAgentRunning || !userQuery.trim()}
        >
          {isAgentRunning ? 'Agent Running...' : 'Run Agent'}
        </button>
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