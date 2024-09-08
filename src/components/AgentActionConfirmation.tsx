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
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm }) => {
  const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (action.action === 'Wait') {
      onConfirm(true);
    }

    const updatePosition = () => {
      const { innerWidth, innerHeight } = window;
      const boxWidth = 300; // Assuming max-width of the box
      const boxHeight = 150; // Approximate height of the box
      const padding = 20;

      if (action.screen_location) {
        const { x, y } = action.screen_location;
        if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
          // Destination is on screen
          setBoxPosition({
            x: Math.min(x + padding, innerWidth - boxWidth - padding),
            y: Math.min(y + padding, innerHeight - boxHeight - padding)
          });
        } else {
          // Destination is off screen, place box in bottom right
          setBoxPosition({
            x: innerWidth - boxWidth - padding,
            y: innerHeight - boxHeight - padding
          });
        }
      } else {
        // No screen_location provided, place box in bottom right
        setBoxPosition({
          x: innerWidth - boxWidth - padding,
          y: innerHeight - boxHeight - padding
        });
      }
    };

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
    <div className="fixed inset-0 z-50" style={boxStyle}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
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
      </div>
    </div>
  );
};

export default AgentActionConfirmation;