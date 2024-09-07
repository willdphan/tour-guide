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
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm }) => {
  console.log('Rendering AgentActionConfirmation', action);

const isActionable = ['Click', 'Type', 'Scroll', 'GoBack', 'Home'].includes(action.action);

  useEffect(() => {
    if (action.action === 'Wait') {
      // Automatically confirm for Wait actions
      onConfirm(true);
    }
  }, [action, onConfirm]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Action</h2>
        <p className="mb-6 text-lg">{action.instruction}</p>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => onConfirm(false)} className="px-6 py-2">
            Cancel
          </Button>
          <Button onClick={() => onConfirm(true)} className="px-6 py-2 bg-red-600 hover:bg-red-700">
            Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentActionConfirmation;