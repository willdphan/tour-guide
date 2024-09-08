import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AnimatedProgressBar from './AnimatedProgressBar';

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
    element_description?: string | null;
    screen_location?: { x: number; y: number };
    hover_before_action?: boolean;
    text_input?: string | null;
  };
  onConfirm: (confirmed: boolean) => void;
  isAgentRunning: boolean;
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm, isAgentRunning, isWaiting }) => {
  const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0 });

  const updatePosition = () => {
    const { innerWidth, innerHeight } = window;
    const boxWidth = 300;
    const boxHeight = 150;
    const cursorPadding = 20;
    const edgePadding = 16;

    if (action.screen_location) {
      const { x, y } = action.screen_location;
      if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
        let newX = x + cursorPadding;
        let newY = y + cursorPadding;

        // Adjust if the box would go off-screen
        if (newX + boxWidth > innerWidth) {
          newX = x - boxWidth - cursorPadding;
        }
        if (newY + boxHeight > innerHeight) {
          newY = y - boxHeight - cursorPadding;
        }

        // Ensure the box stays within the viewport
        newX = Math.max(edgePadding, Math.min(newX, innerWidth - boxWidth - edgePadding));
        newY = Math.max(edgePadding, Math.min(newY, innerHeight - boxHeight - edgePadding));

        setBoxPosition({ x: newX, y: newY });
      } else {
        // Fallback position if cursor is outside the viewport
        setBoxPosition({
          x: innerWidth - boxWidth - edgePadding,
          y: innerHeight - boxHeight - edgePadding
        });
      }
    } else {
      // Default position in bottom right if no cursor location is provided
      setBoxPosition({
        x: innerWidth - boxWidth - edgePadding,
        y: innerHeight - boxHeight - edgePadding
      });
    }
  };

  useEffect(() => {
    if (action.action === 'Wait') {
      onConfirm(true);
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => window.removeEventListener('resize', updatePosition);
  }, [action, onConfirm]);

  const isFixedPosition = action.action == 'Wait' || action.action == 'Processing';

  const boxStyle: React.CSSProperties = isFixedPosition ? {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: 9999,
    maxWidth: '300px',
    width: '100%',
  } : {
    position: 'fixed',
    left: `${boxPosition.x}px`,
    top: `${boxPosition.y}px`,
    zIndex: 9999,
    maxWidth: '300px',
    width: '100%',
  };


  return (
    <div style={boxStyle}>
      <div className=" bg-white p-4 rounded-lg border-[2px] border-blue-500 rounded-[0.5rem]">
        {action.action === 'Wait' ? (
           <>
           <div className=" flex justify-between items-center">
           <p className="text-sm">{action.instruction || "Give me a minute! Thinking..."}</p>
             <Button 
               onClick={() => onConfirm(false)} 
               className="flex-shrink-0 w-6 h-6 p-0 text-xs rounded-full flex items-center justify-center aspect-square border border-black ml-2"
             >
               X
             </Button>
           </div>
         </>
        ) : (
          <>
            <p className="mb-4 text-sm">{action.instruction}</p>
            <div className="flex w-full items-center space-x-4">
              <div className="flex-grow">
                <AnimatedProgressBar />
              </div>
              <Button 
                onClick={() => onConfirm(false)} 
                className="flex-shrink-0 w-6 h-6 p-0 text-xs rounded-full flex items-center justify-center aspect-square border border-black"
              >
                X
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentActionConfirmation;