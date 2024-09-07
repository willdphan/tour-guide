import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
    element_description?: string | null;
    screen_location?: any;
    hover_before_action?: boolean;
    text_input?: string | null;
  };
  onConfirm: (confirmed: boolean) => void;
  cursorPosition: { x: number; y: number };
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm, cursorPosition }) => {
  console.log('Rendering AgentActionConfirmation', action);

  const isActionable = ['Click', 'Type', 'Scroll', 'GoBack', 'Home'].includes(action.action);

  useEffect(() => {
    if (action.action === 'Wait') {
      // Automatically confirm for Wait actions
      onConfirm(true);
    }
  }, [action, onConfirm]);

  const boxStyle: React.CSSProperties = cursorPosition
    ? {
        position: 'fixed',
        left: `${cursorPosition.x + 20}px`,
        top: `${cursorPosition.y + 20}px`,
        zIndex: 9999,
        maxWidth: '300px',
        width: '100%',
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-10%, -10%)',
        zIndex: 9999,
        maxWidth: '300px',
        width: '100%',
      };


  return (
    <div className="fixed inset-0 z-50" style={boxStyle}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-2 text-red-600">Confirm Action</h2>
        <p className="mb-4 text-sm">{action.instruction}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onConfirm(false)} className="px-3 py-1 text-sm">
            Cancel
          </Button>
          <Button onClick={() => onConfirm(true)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-sm">
            Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentActionConfirmation;