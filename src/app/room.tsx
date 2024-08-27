"use client";
import { useState, useEffect } from 'react';
import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useMyPresence, useOthers } from "@liveblocks/react";

function Cursor({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <svg
      style={{
        position: "absolute",
        left: x,
        top: y,
        transition: "all 0.75s ease",
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
  const [apiData, setApiData] = useState<any[]>([]);
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/run-agent/?question=Go%20to%20the%20hookalotto%20page', {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
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
              setApiData(prevData => [...prevData, parsedData]);
              
              // Update cursor position if screen_location is available
              if (parsedData.screen_location) {
                const { x, y } = parsedData.screen_location;
                console.log(`Updating cursor position to: (${x}, ${y})`);
                updateMyPresence({
                  cursor: { x, y },
                });
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Add mouse move event listener to update cursor position
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
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
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
      <button onClick={fetchData}>Run Agent</button>
      <div>
        {apiData.map((data, index) => (
          <div key={index}>
            <h3>Step {index + 1}</h3>
            <p>Action: {data.action}</p>
            <p>Instruction: {data.instruction}</p>
            <p>Element: {data.element_description}</p>
            <p>Coordinates: ({data.screen_location?.x}, {data.screen_location?.y})</p>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={"pk_dev_JHXXlhVbiyY12zGe6mVyVYyAZKm7leqR36yvH_1rY_0Cxxk25HAFapwtmrkUzZz8"}>
      <RoomProvider id="my-room" initialPresence={{
              cursor: null
          }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => <RoomContent>{children}</RoomContent>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}