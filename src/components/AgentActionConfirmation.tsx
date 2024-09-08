import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

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

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm, isAgentRunning }) => {
  const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0 });

  const updatePosition = () => {
    const { innerWidth, innerHeight } = window;
    const boxWidth = 300;
    const boxHeight = 150;
    const cursorPadding = 200;
    const edgePadding = 20;

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
      // Default position if no cursor location is provided
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

  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${boxPosition.x}px`,
    top: `${boxPosition.y}px`,
    zIndex: 9999,
    maxWidth: '300px',
    width: '100%',
  };

  return (
    <div style={boxStyle}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        {isAgentRunning ? (
   <>
  <h2 className="text-xl font-bold text-blue-600">Agent is running...</h2>
  <p className="text-sm mt-2">Please wait while the agent processes the next action.</p>
</>
        
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2 text-blue-600">Confirm Action</h2>
            <p className="mb-4 text-sm">{action.instruction}</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onConfirm(false)} className="px-3 py-1 text-sm">
                Cancel
              </Button>
              <Button onClick={() => onConfirm(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm">
                Proceed
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentActionConfirmation;